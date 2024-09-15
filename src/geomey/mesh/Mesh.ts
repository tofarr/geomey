import {
  angle,
  comparePointsForSort,
  CoordinateConsumer,
  Coordinates,
  isNaNOrInfinite,
  LinearRingCoordinatesConsumer,
  LineStringCoordinatesConsumer,
  reverse,
  sortCoordinates,
} from "../coordinate";
import {
  calculateArea,
  forEachRingLineSegmentCoordinates,
  getMinIndex,
  intersectionLineSegment,
  pointTouchesLineSegment,
  Rectangle,
  signedPerpendicularDistance,
} from "../geom";
import { DISJOINT } from "../Relation";
import { SpatialConsumer } from "../spatialIndex";
import { RTree } from "../spatialIndex/RTree";
import { Tolerance } from "../Tolerance";
import { Edge } from "./Edge";
import { Intersection } from "./Intersection";
import { MeshError } from "./MeshError";
import { Vertex } from "./Vertex";

export class Mesh {
  readonly tolerance: Tolerance;
  private vertices: Map<string, Vertex>;
  private edges: RTree<Edge>;

  constructor(tolerance: Tolerance) {
    this.tolerance = tolerance;
    this.vertices = new Map();
    this.edges = new RTree();
  }

  addPoint(x: number, y: number): Vertex {
    try {
      return this.addVertex(new Vertex(x, y, this.tolerance));
    } catch (e) {
      throw new MeshError(e);
    }
  }

  removePoint(x: number, y: number): boolean {
    const key = calculateKey(x, y, this.tolerance.tolerance);
    const vertex = this.vertices.get(key);
    if (vertex) {
      this.removeVertex(vertex);
      return true;
    }
    return false;
  }

  getVertex(x: number, y: number): Vertex {
    const key = calculateKey(x, y, this.tolerance.tolerance);
    const vertex = this.vertices.get(key);
    return vertex;
  }

  addLink(ax: number, ay: number, bx: number, by: number): Edge[] {
    const a = this.addPoint(ax, ay);
    const b = this.addPoint(bx, by);
    return this.addVertexLink(a, b);
  }

  hasLink(ax: number, ay: number, bx: number, by: number): boolean {
    const a = this.getVertex(ax, ay);
    if (!a) {
      return false;
    }
    const b = this.getVertex(bx, by);
    if (!b) {
      return false;
    }
    return a.links.includes(b);
  }

  removeLink(ax: number, ay: number, bx: number, by: number): boolean {
    const a = this.getVertex(ax, ay);
    if (!a) {
      return false;
    }
    const b = this.getVertex(bx, by);
    if (!b) {
      return false;
    }
    return this.removeVertexLink(a, b);
  }

  xorLink(ax: number, ay: number, bx: number, by: number): Edge[] {
    const a = this.addPoint(ax, ay);
    const b = this.addPoint(bx, by);
    return this.xorVertexLink(a, b);
  }

  public getIntersections(
    ax: number,
    ay: number,
    bx: number,
    by: number,
  ): Intersection[] {
    const { tolerance } = this;
    const a = new Vertex(ax, ay, tolerance);
    const b = new Vertex(bx, by, tolerance);
    const edge = new Edge(a, b);
    const intersections = this.findEdgesIntersectingEdge(edge);
    return intersections;
  }

  private addVertex(vertex: Vertex): Vertex {
    const existing = this.vertices.get(vertex.key);
    if (existing) {
      return existing; // already exists
    }
    this.vertices.set(vertex.key, vertex);

    // If the vertex lies on an existing link, break the link and add the vertex in the middle
    const intersections = this.findEdgesIntersectingVertex(vertex);
    for (const intersection of intersections) {
      const { edge } = intersection;
      this.removeEdge(edge);
      this.addEdge(new Edge(edge.a, vertex));
      this.addEdge(new Edge(edge.b, vertex));
    }
    return vertex;
  }

  private findEdgesIntersectingVertex(vertex: Vertex): Intersection[] {
    const intersections = [];
    const { x, y } = vertex;
    this.edges.findIntersecting(new Rectangle(x, y, x, y), (edge) => {
      const { a, b } = edge;
      const { x: ax, y: ay } = a;
      const { x: bx, y: by } = b;
      if (pointTouchesLineSegment(x, y, ax, ay, bx, by, this.tolerance)) {
        intersections.push({ edge, vertex });
      }
    });
    return intersections;
  }

  private removeVertex(vertex: Vertex) {
    const { links } = vertex;
    for (let i = links.length; i-- > 0; ) {
      const otherVertex = links[i];
      this.removeVertexLink(vertex, otherVertex);
    }
    this.vertices.delete(vertex.key);
  }

  private addVertexLink(a: Vertex, b: Vertex): Edge[] {
    if (a == b) {
      return [];
    }
    if (a.links.includes(b)) {
      return [];
    }
    const edge = new Edge(a, b);
    const intersections = this.findEdgesIntersectingEdge(edge);
    const results = [];
    let prev = edge.a;
    for (const intersection of intersections) {
      let { vertex } = intersection;
      const existing = this.vertices.get(vertex.key);
      if (existing) {
        vertex = existing;
      } else {
        this.vertices.set(vertex.key, vertex);
      }

      const ie = intersection.edge;
      const { a: iea, b: ieb } = ie;
      if (iea !== vertex && ieb !== vertex) {
        this.removeEdge(ie);
        this.addEdge(new Edge(ie.a, vertex));
        this.addEdge(new Edge(ie.b, vertex));
      }
      if (vertex != prev) {
        results.push(this.addEdge(new Edge(prev, vertex)));
      }
      prev = vertex;
    }
    if (prev != edge.b) {
      results.push(this.addEdge(new Edge(prev, edge.b)));
    }
    return results;
  }

  private addEdge(edge: Edge): Edge {
    const { a, b, rectangle } = edge;
    const aLinks = a.links as Vertex[];

    if (aLinks.includes(b)) {
      // This means that different edge objects may be returned each time...
      return edge;
    }
    aLinks.push(b);
    aLinks.sort(
      (u, v) => angle(a.x, a.y, u.x, u.y) - angle(a.x, a.y, v.x, v.y),
    );
    const bLinks = b.links as Vertex[];
    bLinks.push(a);
    bLinks.sort(
      (u, v) => angle(b.x, b.y, u.x, u.y) - angle(b.x, b.y, v.x, v.y),
    );
    this.edges.add(rectangle, edge);
    return edge;
  }

  private removeVertexLink(a: Vertex, b: Vertex): boolean {
    if (a == b) {
      return false;
    }
    const { x: ax, y: ay } = a
    const { x: bx, y: by } = b
    if (comparePointsForSort(ax, ay, bx, by) > 0){
      [a, b] = [b, a]
    }
    const { edges } = this;
    const rectangle = Rectangle.valueOf([ax, ay, bx, by]);
    if (!edges.remove(rectangle, (v) => v.a === a && v.b === b)) {
      return false;
    }
    const aLinks = a.links as Vertex[];
    aLinks.splice(aLinks.indexOf(b), 1);
    const bLinks = b.links as Vertex[];
    bLinks.splice(bLinks.indexOf(a), 1);
    return true;
  }

  private removeEdge(edge: Edge) {
    const { a, b } = edge;
    const { edges } = this;
    edges.remove(edge.rectangle, (e) => e === edge);
    const aLinks = a.links as Vertex[];
    aLinks.splice(aLinks.indexOf(b), 1);
    const bLinks = b.links as Vertex[];
    bLinks.splice(bLinks.indexOf(a), 1);
  }

  private findEdgesIntersectingEdge(e: Edge): Intersection[] {
    const { a, b } = e;
    const { x: ax, y: ay } = a;
    const { x: bx, y: by } = b;
    const { tolerance } = this;
    const intersections = [];
    this.edges.findIntersecting(e.rectangle, (edge) => {
      const { x: jax, y: jay } = edge.a;
      const { x: jbx, y: jby } = edge.b;
      const containsJA = tolerance.within(
        signedPerpendicularDistance(jax, jay, ax, ay, bx, by),
      );
      const containsJB = tolerance.within(
        signedPerpendicularDistance(jbx, jby, ax, ay, bx, by),
      );
      if (containsJA && containsJB) {
        // Special case - lines are colinear...
        for (const vertex of [edge.a, edge.b]) {
          const { x, y } = vertex;
          let progress = (x - ax) / (bx - ax);
          if (isNaNOrInfinite(progress)) {
            progress = (y - ay) / (by - ay);
          }
          if (
            progress >= -tolerance.tolerance &&
            progress <= 1 + tolerance.tolerance
          ) {
            intersections.push({ vertex, edge });
          }
        }
      } else {
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
          intersections.push({
            edge,
            vertex: new Vertex(intersection.x, intersection.y, tolerance),
          });
        }
      }
    });
    intersections.sort((a, b) =>
      comparePointsForSort(a.vertex.x, a.vertex.y, b.vertex.x, b.vertex.y),
    );
    return intersections;
  }

  private xorVertexLink(a: Vertex, b: Vertex) {
    if (a == b) {
      return;
    }
    if (a.links.includes(b)) {
      this.removeVertexLink(a, b);
      return;
    }
    const edge = new Edge(a, b);
    const intersections = this.findEdgesIntersectingEdge(edge);
    const results = [];
    let prev = edge.a;
    for (const intersection of intersections) {
      let { vertex } = intersection;
      const existing = this.vertices.get(vertex.key);
      if (existing) {
        vertex = existing;
      } else {
        this.vertices.set(vertex.key, vertex);
      }
      const ie = intersection.edge;
      const { a: iea, b: ieb } = ie;
      if (iea !== vertex && ieb !== vertex) {
        this.removeEdge(ie);
        this.addEdge(new Edge(ie.a, vertex));
        this.addEdge(new Edge(ie.b, vertex));
      }
      if (vertex != prev) {
        this.xorEdge(new Edge(prev, vertex), results);
      }
      prev = vertex;
    }
    if (prev != edge.b) {
      this.xorEdge(new Edge(prev, edge.b), results);
    }
    return results;
  }

  private xorEdge(edge: Edge, results: Edge[]) {
    if (edge.a.links.includes(edge.b)) {
      this.removeEdge(edge);
    } else {
      this.addEdge(edge);
      results.push(edge);
    }
  }

  forEachVertex(
    consumer: (vertex: Vertex) => boolean | void,
    rectangle?: Rectangle,
  ): boolean {
    if (rectangle) {
      for (const vertex of this.vertices.values()) {
        if (
          rectangle.relatePoint(vertex.x, vertex.y, this.tolerance) === DISJOINT
        ) {
          continue;
        }
        if (consumer(vertex) === false) {
          return false;
        }
      }
    } else {
      for (const vertex of this.vertices.values()) {
        if (consumer(vertex) === false) {
          return false;
        }
      }
    }
    return true;
  }

  getVertices() {
    const results = Array.from(this.vertices.values());
    results.sort((a, b) => comparePointsForSort(a.x, a.y, b.x, b.y));
    return results;
  }

  getCoordinates(): number[] {
    const results = [];
    this.forEachVertex(({ x, y }) => {
      results.push(x, y);
    });
    sortCoordinates(results);
    return results;
  }

  forEachEdge(consumer: SpatialConsumer<Edge>, rectangle?: Rectangle): boolean {
    if (rectangle) {
      return this.edges.findIntersecting(rectangle, consumer);
    } else {
      return this.edges.findAll(consumer);
    }
  }

  getEdges(): Edge[] {
    const results: Edge[] = [];
    this.forEachEdge((edge) => {
      results.push(edge);
    });
    results.sort((i, j) => {
      return (
        comparePointsForSort(i.a.x, i.a.y, j.a.x, j.a.y) ||
        comparePointsForSort(i.b.x, i.b.y, j.b.x, j.b.y)
      );
    });
    return results;
  }

  getEdgeCoordinates(): [number, number, number, number][] {
    return this.getEdges().map((link) => [
      link.a.x,
      link.a.y,
      link.b.x,
      link.b.y,
    ]);
  }

  forEachVertexAndEdgeCentroid(consumer: CoordinateConsumer): boolean {
    if (!this.forEachVertex(({ x, y }) => consumer(x, y))) {
      return false;
    }
    const { tolerance } = this;
    return this.forEachEdge(({ a, b }) => {
      const x = tolerance.normalize((a.x + b.x) / 2);
      const y = tolerance.normalize((a.y + b.y) / 2);
      return consumer(x, y);
    });
  }

  forEachLineString(consumer: LineStringCoordinatesConsumer): boolean {
    const tolerance = this.tolerance.tolerance;
    const processed = new Set<string>();
    const vertices = this.getVertices();
    for (const a of vertices) {
      if (a.links.length !== 1) {
        continue;
      }
      for (const b of a.links) {
        const key = calculateEdgeKey(a, b, tolerance);
        if (processed.has(key)) {
          continue;
        }
        const coordinates = followLineString(a, b, tolerance, processed);
        if (consumer(coordinates) === false) {
          return false;
        }
      }
    }
    for (const a of vertices) {
      for (const b of a.links) {
        const key = calculateEdgeKey(a, b, tolerance);
        if (processed.has(key)) {
          continue;
        }
        const coordinates = followLinearRing(a, b);
        coordinates.push(a.x, a.y);
        forEachRingLineSegmentCoordinates(coordinates, (ax, ay, bx, by) => {
          processed.add(calculateCoordinateEdgeKey(ax, ay, bx, by, tolerance));
        });
        if (consumer(coordinates) === false) {
          return false;
        }
      }
    }
    return true;
  }

  getLineStrings(): Coordinates[] {
    const results = [];
    this.forEachLineString((lineString) => {
      const { length } = lineString;
      if (
        comparePointsForSort(
          lineString[0],
          lineString[1],
          lineString[length - 2],
          lineString[length - 1],
        ) > 0
      ) {
        lineString = reverse(lineString);
      }
      results.push(lineString);
    });
    results.sort(coordinateComparator);
    return results;
  }

  /**
   * Note: The rings produced by this will not allow for XOR style functionality.
   * Common lines are duplicated! For example.
   *  -----      ---     ---
   *  | | |  =>  | |  +  | |
   *  -----      ---     ---
   */
  forEachLinearRing(consumer: LinearRingCoordinatesConsumer): boolean {
    const tolerance = this.tolerance.tolerance;
    const processed = new Set<string>();
    const vertices = this.getVertices();

    // First we process anything that is a trailing line string
    for (const a of vertices) {
      if (a.links.length == 1) {
        const b = a.links[0];
        const key = calculateEdgeKey(a, b, tolerance);
        if (!processed.has(key)) {
          followLineString(a, b, tolerance, processed);
        }
      }
    }

    // Anything remaining which is unprocessed is part of a ring!
    for (const a of vertices) {
      for (const b of a.links) {
        const key = calculateEdgeKey(a, b, tolerance);
        if (processed.has(key)) {
          continue;
        }
        let coordinates = followLinearRing(a, b);
        if (calculateArea(coordinates) < 0) {
          // If the ring is backwards, try finding a new ring in the opposite direction
          coordinates = followLinearRing(b, a);
        }
        forEachRingLineSegmentCoordinates(coordinates, (ax, ay, bx, by) => {
          processed.add(calculateCoordinateEdgeKey(ax, ay, bx, by, tolerance));
        });
        if (consumer(coordinates) === false) {
          return false;
        }
      }
    }
    return true;
  }

  getLinearRings(): number[][] {
    const results = [];
    this.forEachLinearRing((ring) => {
      const minIndex = getMinIndex(ring);
      if (minIndex) {
        const c = ring.slice(minIndex);
        c.push(...ring.slice(0, minIndex));
        ring = c;
      }
      results.push(ring);
    });
    results.sort(coordinateComparator);
    return results;
  }

  clone() {
    const result = new Mesh(this.tolerance);
    this.vertices.forEach((vertex) => {
      result.vertices.set(
        vertex.key,
        new Vertex(vertex.x, vertex.y, this.tolerance, vertex.key),
      );
    });
    this.edges.findAll(({ a, b }) => {
      result.addLink(a.x, a.y, b.x, b.y);
    });
    return result;
  }

  cull(match: (x: number, y: number) => boolean) {
    this.cullEdges(match);
    this.cullVertices(match);
  }

  cullEdges(match: (x: number, y: number) => boolean) {
    const toRemove = [];
    this.forEachEdge((edge) => {
      const { a, b } = edge;
      const { x: ax, y: ay } = a;
      const { x: bx, y: by } = b;
      const x = (ax + bx) / 2;
      const y = (ay + by) / 2;
      if (match(x, y)) {
        toRemove.push(edge);
      }
    });
    for (const edge of toRemove) {
      this.removeEdge(edge);
    }
  }

  cullVertices(match: (x: number, y: number, links: Vertex[]) => boolean) {
    const toRemove = [];
    this.forEachVertex((vertex) => {
      const { x, y, links } = vertex;
      if (match(x, y, links as Vertex[])) {
        toRemove.push(vertex);
      }
    });
    for (const vertex of toRemove) {
      this.removeVertex(vertex);
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
    const key = calculateEdgeKey(a, b, tolerance);
    processed.add(key);
    coordinates.push(b.x, b.y);
    const { links } = b;
    if (links.length != 2) {
      return coordinates;
    }
    const c = links[links[0] == a ? 1 : 0];
    a = b;
    b = c;
  }
}

function followLinearRing(a: Vertex, b: Vertex): number[] {
  const origin = a;
  const coordinates = [a.x, a.y];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    coordinates.push(b.x, b.y);
    const { links } = b;
    let index = links.indexOf(a) - 1;
    if (index < 0) {
      index += links.length;
    }
    const c = links[index];
    if (c == origin) {
      return coordinates;
    }
    a = b;
    b = c;
  }
}

function calculateEdgeKey(a: Vertex, b: Vertex, tolerance: number) {
  return calculateCoordinateEdgeKey(a.x, a.y, b.x, b.y, tolerance);
}

function calculateCoordinateEdgeKey(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  tolerance: number,
) {
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
  );
}
