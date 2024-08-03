import {
  angle,
  comparePointsForSort,
  coordinateEqual,
  forEachLineSegmentCoordinates,
  isNaNOrInfinite,
  LinearRingCoordinatesConsumer,
  LineStringCoordinatesConsumer,
  sortCoordinates,
} from "../coordinate";
import {
  intersectionLineSegment,
  pointTouchesLineSegment,
  Rectangle,
} from "../geom";
import { Tolerance } from "../Tolerance";
import { Link } from "./Link";
import { MeshError } from "./MeshError";
import { Vertex } from "./Vertex";
import { DISJOINT } from "../Relation";
import { SpatialConsumer } from "../spatialIndex";
import { RTree } from "../spatialIndex/RTree";

/**
 * Class describing a network of Vertices and Links, which may be used to build geometries.
 * Vertexes in a mesh are unique and rounded to the nearest tolerance, and links may not cross
 * each other outside of a vertex. (If they do, a vertex is added.)
 *
 * Internally, Z order indexes are used to maintain performance.
 */
export class Mesh {
  readonly tolerance: Tolerance;
  private vertices: Map<string, Vertex>;
  private links: RTree<Link>;

  constructor(tolerance: Tolerance) {
    this.tolerance = tolerance;
    this.vertices = new Map();
    this.links = new RTree();
  }

  addVertex(x: number, y: number): Vertex {
    const { tolerance } = this;

    // Normalize point...
    if (isNaNOrInfinite(x, y)) {
      throw new MeshError(`Invalid Vertex: ${x} ${y}`);
    }
    x = tolerance.normalize(x);
    y = tolerance.normalize(y);

    // Add vertex
    const key = calculateKey(x, y, tolerance.tolerance);
    let vertex = this.vertices.get(key);
    if (vertex) {
      return vertex; // already exists
    }
    vertex = new Vertex(x, y, key);
    this.vertices.set(key, vertex);

    // If the vertex lies on an existing link, break the link and add the vertex in the middle
    this.links.findIntersecting(
      Rectangle.unsafeValueOf(x, y, x, y),
      ({ a, b }) => {
        const { x: ax, y: ay } = a;
        const { x: bx, y: by } = b;
        if ((x == ax && y == ay) || (x == bx && y == by)) {
          return;
        }
        if (pointTouchesLineSegment(x, y, ax, ay, bx, by, tolerance)) {
          this.removeLink(ax, ay, bx, by);
          this.addLinkInternal(ax, ay, x, y);
          this.addLinkInternal(bx, by, x, y);
          return false;
        }
      },
    );
    return vertex;
  }
  getVertex(x: number, y: number): Vertex | null {
    const key = calculateKey(x, y, this.tolerance.tolerance);
    return this.vertices.get(key);
  }
  getOrigin(): Vertex | null {
    let result = null;
    for (const vertex of this.vertices.values()) {
      if (
        !result ||
        comparePointsForSort(vertex.x, vertex.y, result.x, result.y) < 0
      ) {
        result = vertex;
      }
    }
    return result;
  }
  /**
   * Add a link to the mesh. splitting may occur, so return the number of links actually added to the mesh.
   */
  addLink(ax: number, ay: number, bx: number, by: number): number {
    const { tolerance } = this;

    // Normalize link...
    if (isNaNOrInfinite(ax, ay, bx, by)) {
      throw new MeshError(`Invalid Link: ${ax} ${ay} ${bx} ${by}`);
    }
    ax = tolerance.normalize(ax);
    ay = tolerance.normalize(ay);
    bx = tolerance.normalize(bx);
    by = tolerance.normalize(by);
    const compare = comparePointsForSort(ax, ay, bx, by);
    if (compare == 0) {
      return 0; // Can't link to self!
    } else if (compare > 0) {
      [bx, by, ax, ay] = [ax, ay, bx, by];
    }

    // Check if link already exists
    const key = calculateKey(ax, ay, tolerance.tolerance);
    const vertex = this.vertices.get(key);
    if (vertex) {
      if (vertex.links.find((v) => v.x === bx && v.y === by)) {
        return 0;
      }
    }

    // check if the link intersects any existing links
    const toRemove = [];
    const toAdd = [];
    const intersections = [ax, ay];
    this.links.findIntersecting(Rectangle.valueOf([ax, ay, bx, by]), (link) => {
      const { x: jax, y: jay } = link.a;
      const { x: jbx, y: jby } = link.b;
      const intersection = intersectionLineSegment(
        ax,
        ay,
        bx,
        by,
        jax,
        jay,
        jbx,
        jby,
        tolerance,
      );
      if (intersection) {
        const { x: ix, y: iy } = intersection;
        if (
          !(
            coordinateEqual(jax, jay, ix, iy) ||
            coordinateEqual(jbx, jby, ix, iy)
          )
        ) {
          toRemove.push(jax, jay, jbx, jby);
          toAdd.push(jax, jay, ix, iy, ix, iy, jbx, jby);
        }
        intersections.push(ix, iy)
      }
    });
    intersections.push(bx, by)
    let i = 0;
    while (i < toRemove.length) {
      this.removeLink(
        toRemove[i++],
        toRemove[i++],
        toRemove[i++],
        toRemove[i++],
      );
    }
    i = 0;
    while (i < toAdd.length) {
      this.addLinkInternal(toAdd[i++], toAdd[i++], toAdd[i++], toAdd[i++]);
    }
    sortCoordinates(intersections)
    let iax = intersections[0]
    let iay = intersections[1]
    i = 2
    while(i < intersections.length){
      const ibx = intersections[i++]
      const iby = intersections[i++]
      if (!(tolerance.match(iax, ibx) && tolerance.match(iay, iby))) {
        this.addLinkInternal(iax, iay, ibx, iby)
        iax = ibx
        iay = iby
      }
    }
    return (intersections.length >> 1) - 1;
  }
  private addLinkInternal(ax: number, ay: number, bx: number, by: number) {
    const a = this.addVertex(ax, ay);
    const b = this.addVertex(bx, by);
    const aLinks = a.links as Vertex[];
    aLinks.push(b);
    aLinks.sort((u, v) => angle(a.x, a.y, u.x, u.y) - angle(a.x, a.y, v.x, v.y))
    const bLinks = b.links as Vertex[];
    bLinks.push(a);
    bLinks.sort((u, v) => angle(b.x, b.y, u.x, u.y) - angle(b.x, b.y, v.x, v.y))
    this.links.add(Rectangle.valueOf([ax, ay, bx, by]), { a, b });
  }
  getIntersections(ax: number, ay: number, bx: number, by: number): number[] {
    const { tolerance } = this;

    if (isNaNOrInfinite(ax, ay, bx, by)) {
      throw new MeshError(`Invalid Link: ${ax} ${ay} ${bx} ${by}`);
    }
    const mx = ax;
    const my = ay;
    ax = tolerance.normalize(ax);
    ay = tolerance.normalize(ay);
    bx = tolerance.normalize(bx);
    by = tolerance.normalize(by);
    const compare = comparePointsForSort(ax, ay, bx, by);
    if (compare == 0) {
      return []; // Can't link to self!
    } else if (compare > 0) {
      [bx, by, ax, ay] = [ax, ay, bx, by];
    }

    const intersections = [];
    const rectangle = Rectangle.valueOf([ax, ay, bx, by]);
    this.links.findIntersecting(rectangle, (link) => {
      const { x: jax, y: jay } = link.a;
      const { x: jbx, y: jby } = link.b;
      const intersection = intersectionLineSegment(
        ax,
        ay,
        bx,
        by,
        jax,
        jay,
        jbx,
        jby,
        tolerance,
      );
      if (intersection) {
        const x = tolerance.normalize(intersection.x);
        const y = tolerance.normalize(intersection.y);
        if ((x === ax && y === ay) || (x === bx && y === by)) {
          return;
        }
        intersections.push(x, y);
      }
    });
    sortCoordinates(intersections, (ix, iy, jx, jy) => {
      const distI = (ix - mx) ** 2 + (iy - my) ** 2;
      const distJ = (jx - mx) ** 2 + (jy - my) ** 2;
      return distI - distJ;
    });
    return intersections;
  }
  removeVertex(x: number, y: number): boolean {
    const tolerance = this.tolerance.tolerance;

    if (isNaNOrInfinite(x, y)) {
      return false; // Invalid point can't be removed
    }
    x = Math.round(x / tolerance) * tolerance;
    y = Math.round(y / tolerance) * tolerance;

    const key = calculateKey(x, y, tolerance);
    const vertex = this.vertices.get(key);
    if (!vertex) {
      return false;
    }
    const { links } = vertex
    for (let i = links.length; i-- > 0;) {
      const otherVertex = links[i]
      this.removeLink(x, y, otherVertex.x, otherVertex.y);
    }
    this.vertices.delete(key);
    return true;
  }
  removeLink(ax: number, ay: number, bx: number, by: number): boolean {
    const compare = comparePointsForSort(ax, ay, bx, by);
    if (compare == 0) {
      return false; // Can't link to self!
    } else if (compare > 0) {
      [bx, by, ax, ay] = [ax, ay, bx, by];
    }
    const { tolerance } = this;
    const { tolerance: t } = tolerance;

    ax = Math.round(ax / t) * t;
    ay = Math.round(ay / t) * t;
    bx = Math.round(bx / t) * t;
    by = Math.round(by / t) * t;

    const key = calculateKey(ax, ay, t);
    const a = this.vertices.get(key);
    if (!a) {
      return false;
    }
    const b = a.links.find((v) => v.x == bx && v.y == by);
    if (!b) {
      return false;
    }

    const rectangle = Rectangle.valueOf([ax, ay, bx, by]);
    const { links } = this;
    links.remove(rectangle, (v) => v.a === a && v.b === b);
    const aLinks = a.links as Vertex[];
    aLinks.splice(aLinks.indexOf(b), 1);
    const bLinks = b.links as Vertex[];
    bLinks.splice(bLinks.indexOf(a), 1);
    return true;
  }
  forEachVertex(
    consumer: (vertex: Vertex) => boolean | void,
    rectangle?: Rectangle,
  ) {
    if (rectangle) {
      for (const vertex of this.vertices.values()) {
        if (
          rectangle.relatePoint(vertex.x, vertex.y, this.tolerance) === DISJOINT
        ) {
          continue;
        }
        if (consumer(vertex) === false) {
          return;
        }
      }
    } else {
      for (const vertex of this.vertices.values()) {
        if (consumer(vertex) === false) {
          return;
        }
      }
    }
  }
  getVertices() {
    const results = Array.from(this.vertices.values());
    results.sort((a, b) => comparePointsForSort(a.x, a.y, b.x, b.y))
    return results;
  }
  getCoordinates(): number[] {
    const results = []
    this.forEachVertex(({x, y}) => { results.push(x, y) })
    sortCoordinates(results)
    return results
  }
  forEachLink(consumer: SpatialConsumer<Link>, rectangle?: Rectangle) {
    if (rectangle) {
      this.links.findIntersecting(rectangle, consumer);
    } else {
      this.links.findAll(consumer);
    }
  }
  getLinks(): Link[] {
    const results: Link[] = []
    this.forEachLink(link => { results.push(link) })
    results.sort((i, j) => {
      return (
        comparePointsForSort(i.a.x, i.a.y, j.a.x, j.a.y) ||
        comparePointsForSort(i.b.x, i.b.y, j.b.x, j.b.y)
      )
    });
    return results
  }
  getLinkCoordinates(): [number, number, number, number][] {
    return this.getLinks().map(link => [
      link.a.x, link.a.y, link.b.x, link.b.y
    ])
  }
  forEachLineString(consumer: LineStringCoordinatesConsumer) {
    const tolerance = this.tolerance.tolerance;
    const processed = new Set<string>();
    const vertices = []
    this.forEachVertex(vertex => { vertices.push(vertex) })
    vertices.sort((a, b) => comparePointsForSort(a.x, a.y, b.x, b.y))
    for (const a of vertices) {
      if (a.links.length !== 1) {
        continue;
      }
      for (const b of a.links) {
        const key = calculateLinkKey(a, b, tolerance);
        if (processed.has(key)) {
          continue;
        }
        const coordinates = followLineString(a, b, tolerance, processed);
        if (consumer(coordinates) === false) {
          continue;
        }
      }
    }
    for (const a of vertices) {
      for (const b of a.links) {
        const key = calculateLinkKey(a, b, tolerance);
        if (processed.has(key)) {
          continue;
        }
        const coordinates = followSimpleLinearRing(a, b, tolerance, processed);
        if (consumer(coordinates) === false) {
          return;
        }
      }
    }
  }
  getLineStrings(): [number, number, number, number][] {
    const results = []
    this.forEachLineString(lineString => { results.push(lineString) })
    results.sort(coordinateComparator)
    return results
  }
  /**
   * Note: The rings produced by this will not allow for XOR style functionality.
   * Common lines are duplicated! For example.
   *  -----      ---     ---
   *  | | |  =>  | |  +  | |
   *  -----      ---     ---
   */
  forEachLinearRing(consumer: LinearRingCoordinatesConsumer) {
    const tolerance = this.tolerance.tolerance;
    const processed = new Set<string>();
    const vertices = [];
    this.forEachVertex((vertex) => {
      vertices.push(vertex);
    });
    vertices.sort((a, b) => comparePointsForSort(a.x, a.y, b.x, b.y));

    // First we process anything that is a trailing line string
    for (const a of vertices) {
      if (a.links.length == 1) {
        const b = a.links[0];
        const key = calculateLinkKey(a, b, tolerance);
        if (!processed.has(key)) {
          followLineString(a, b, tolerance, processed);
        }
      }
    }

    // Anything remaining which is unprocessed is part of a ring!
    for (const a of vertices) {
      for (const b of a.links) {
        const key = calculateLinkKey(a, b, tolerance);
        if (processed.has(key)) {
          continue;
        }
        const coordinates = followLinearRing(a, b, tolerance, processed);
        if (consumer(coordinates) === false) {
          return;
        }
      }
    }
  }
  getLinearRings(): number[][] {
    const results = []
    this.forEachLinearRing(lineString => { results.push(lineString) })
    results.sort(coordinateComparator)
    return results
  }
  clone() {
    const result = new Mesh(this.tolerance);
    this.vertices.forEach((vertex) => {
      result.vertices.set(
        vertex.key,
        new Vertex(vertex.x, vertex.y, vertex.key),
      );
    });
    this.links.findAll(({ a, b }, rectangle) => {
      a = result.vertices.get(a.key);
      b = result.vertices.get(b.key);
      const aLinks = a.links as Vertex[];
      const bLinks = b.links as Vertex[];
      aLinks.push(b);
      bLinks.push(a);
      result.links.add(rectangle, { a, b });
    });
    this.vertices.forEach((vertex) => result.addVertex(vertex.x, vertex.y));
    this.links.findAll(({ a, b }) => {
      result.addLink(a.x, a.y, b.x, b.y);
    });
    return result;
  }
  cull(match: (x: number, y: number) => boolean) {
    this.cullLinks(match);
    this.cullVertices(match);
  }
  cullLinks(match: (x: number, y: number) => boolean) {
    const toRemove = [];
    this.forEachLink(({ a, b }) => {
      const { x: ax, y: ay } = a;
      const { x: bx, y: by } = b;
      const x = (ax + bx) / 2;
      const y = (ay + by) / 2;
      if (match(x, y)) {
        toRemove.push(ax, ay, bx, by);
      }
    });
    const { length } = toRemove;
    let i = 0;
    while (i < length) {
      this.removeLink(
        toRemove[i++],
        toRemove[i++],
        toRemove[i++],
        toRemove[i++],
      );
    }
  }
  cullVertices(match: (x: number, y: number) => boolean) {
    const toRemove = [];
    this.forEachVertex(({ x, y }) => {
      if (match(x, y)) {
        toRemove.push(x, y);
      }
    });
    const { length } = toRemove;
    let i = 0;
    while (i < length) {
      this.removeVertex(toRemove[i++], toRemove[i++]);
    }
  }
}

function followLineString(
  origin: Vertex,
  b: Vertex,
  tolerance: number,
  processed: Set<string>,
): number[] {
  let a = origin;
  const coordinates = [a.x, a.y];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const key = calculateLinkKey(a, b, tolerance);
    processed.add(key);
    coordinates.push(b.x, b.y);
    const { links } = b
    if (links.length != 2) {
      return coordinates;
    }
    const c = links[links[0] == a ? 1 : 0];
    a = b;
    b = c;
  }
}

function followSimpleLinearRing(
  a: Vertex,
  b: Vertex,
  tolerance: number,
  processed: Set<string>,
): number[] {
  const origin = a;
  const coordinates = [a.x, a.y, b.x, b.y];
  processed.add(calculateLinkKey(a, b, tolerance));
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { links } = b;
    const c = links[links[0] == a ? 1 : 0];
    coordinates.push(c.x, c.y);
    processed.add(calculateLinkKey(b, c, tolerance));
    if (c == origin) {
      return coordinates;
    }
    a = b;
    b = c;
  }
}

function followLinearRing(
  a: Vertex,
  b: Vertex,
  tolerance: number,
  processed: Set<string>,
): number[] {
  const origin = a;
  const coordinates = [a.x, a.y];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    coordinates.push(b.x, b.y);
    processed.add(calculateLinkKey(a, b, tolerance));
    const { links } = b
    let index = links.indexOf(a) - 1
    if (index < 0){
      index += links.length
    }
    const c = links[index]
    if (c == origin) {
      processed.add(calculateLinkKey(b, c, tolerance));
      return coordinates;
    }
    a = b;
    b = c;
  }
}

function calculateLinkKey(a: Vertex, b: Vertex, tolerance: number) {
  let { x: ax, y: ay } = a;
  let { x: bx, y: by } = b;
  if (comparePointsForSort(ax, ay, bx, by) > 0) {
    [ax, ay, bx, by] = [bx, by, ax, ay];
  }
  return `${calculateKey(ax, ay, tolerance)}:${calculateKey(
    bx,
    by,
    tolerance,
  )}`;
}

function calculateKey(x: number, y: number, tolerance: number): string {
  return `${Math.round(x / tolerance)}:${Math.round(y / tolerance)}`;
}

function coordinateComparator(i: number[], j: number[]) {
  return (
    comparePointsForSort(i[0], i[1], j[0], j[1]) ||
    comparePointsForSort(i[2], i[3], j[2], j[3])
  )
}