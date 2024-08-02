import {
  appendChanged,
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
import { removeNonRingVertices } from "./op/removeNonRingVertices";
import { popLinearRing } from "./op/popLinearRing";
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
        if (pointTouchesLineSegment(x, y, ax, ay, bx, by, tolerance)) {
          this.removeLink(ax, ay, bx, by);
          this.addLink(ax, ay, x, y);
          this.addLink(bx, by, x, y);
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
    const toRemove = []
    const toAdd = []
    const intersections = [ax, ay]
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
          toRemove.push(jax, jay, jbx, jby)
          toAdd.push(jax, jay, ix, iy, ix, iy, jbx, jby)
        }
        appendChanged(ix, iy, tolerance, intersections)
      }
    })
    appendChanged(bx, by, tolerance, intersections)
    let i = 0
    while(i < toRemove.length) {
      this.removeLink(toRemove[i++], toRemove[i++], toRemove[i++], toRemove[i++]) 
    }
    i = 0
    while(i < toAdd.length) {
      this.addLinkInternal(toAdd[i++], toAdd[i++], toAdd[i++], toAdd[i++])
    }
    forEachLineSegmentCoordinates(intersections, (ax, ay, bx, by) => {
      this.addLinkInternal(ax, ay, bx, by)
    })
    return (intersections.length >> 1) - 1;
  }
  private addLinkInternal(ax: number, ay: number, bx: number, by: number) {
    const a = this.addVertex(ax, ay)
    const b = this.addVertex(bx, by)
    const aLinks = a.links as Vertex[];
    aLinks.push(b);
    aLinks.sort((u, v) => comparePointsForSort(u.x, u.y, v.x, v.y));
    const bLinks = b.links as Vertex[];
    bLinks.push(a);
    bLinks.sort((u, v) => comparePointsForSort(u.x, u.y, v.x, v.y));
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
    for (const otherVertex of vertex.links) {
      this.removeLink(x, y, otherVertex.x, otherVertex.y);
    }
    this.vertices.delete(key);
    return true;
  }
  removeLink(ax: number, ay: number, bx: number, by: number): boolean {
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
  forEachLink(consumer: SpatialConsumer<Link>, rectangle?: Rectangle) {
    if (rectangle) {
      this.links.findIntersecting(rectangle, consumer);
    } else {
      this.links.findAll(consumer);
    }
  }
  forEachLineString(consumer: LineStringCoordinatesConsumer) {
    const spikes = new Map<string, Vertex>();
    const processed = new Set<string>();
    for (const vertex of this.vertices.values()) {
      const { links, key } = vertex;
      if (processed.has(key)) {
        continue;
      }
      if (links.length == 2) {
        spikes.set(key, vertex);
        continue;
      }
      if (
        processLineStringNexus(vertex, spikes, processed, consumer) === false
      ) {
        return;
      }
    }
    for (const vertex of Array.from(spikes.values())) {
      if (
        processLineStringNexus(vertex, spikes, processed, consumer) === false
      ) {
        return;
      }
    }
  }
  /**
   * Note: The rings produced by this will not allow for XOR style functionality.
   * Common lines are duplicated! For example.
   *  -----      ---     ---
   *  | | |  =>  | |  +  | |
   *  -----      ---     ---
   */
  forEachLinearRing(consumer: LinearRingCoordinatesConsumer) {
    const mesh = this.clone();
    // eslint-disable-next-line no-constant-condition
    while (true) {
      removeNonRingVertices(mesh);
      const ring = popLinearRing(mesh);
      if (ring == null) {
        return;
      }
      if (consumer(ring) === false) {
        return;
      }
    }
  }
  getVertices() {
    const result = Array.from(this.vertices.values());
    return result;
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

export function processLineStringNexus(
  nexus: Vertex,
  spikes: Map<string, Vertex>,
  processed: Set<string>,
  consumer: LineStringCoordinatesConsumer,
): boolean {
  for (const link of nexus.links) {
    if (processed.has(link.key)) {
      continue;
    }
    const coordinates = followLineString(nexus, link, spikes, processed);
    if (!consumer(coordinates)) {
      return false;
    }
  }
  return true;
}

export function followLineString(
  origin: Vertex,
  b: Vertex,
  spikes: Map<string, Vertex>,
  processed: Set<string>,
): number[] {
  let a = origin;
  const coordinates = [a.x, a.y, b.x, b.y];
  processLineStringVertex(a, spikes, processed);
  processLineStringVertex(b, spikes, processed);
  while (b.links.length == 2 && b != origin) {
    const c = b.links[b[0] == a ? 1 : 0];
    coordinates.push(c.x, c.y);
    processLineStringVertex(c, spikes, processed);
    a = b;
    b = c;
  }
  return coordinates;
}

function processLineStringVertex(
  vertex: Vertex,
  spikes: Map<string, Vertex>,
  processed: Set<string>,
) {
  const { key } = vertex;
  spikes.delete(key);
  processed.add(key);
}

function calculateKey(x: number, y: number, tolerance: number): string {
  return `${Math.round(x / tolerance)}:${Math.round(y / tolerance)}`;
}
