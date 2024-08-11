import { NumberFormatter } from "../formatter";
import { PathWalker } from "../path/PathWalker";
import { B_INSIDE_A, DISJOINT, Relation, TOUCH } from "../Relation";
import { Tolerance } from "../Tolerance";
import { Transformer } from "../transformer/Transformer";
import { AbstractGeometry } from "./AbstractGeometry";
import { Geometry, ringToWkt, Point, Rectangle } from "./";
import { signedPerpendicularDistance } from "./LineSegment";
import { GeoJsonPolygon } from "../geoJson";
import { comparePointsForSort, validateCoordinates } from "../coordinate";
import { Vertex } from "../mesh/Vertex";
import { Mesh } from "../mesh/Mesh";
import { MeshPathWalker } from "../mesh/MeshPathWalker";

export class Triangle extends AbstractGeometry {
  readonly ax: number;
  readonly ay: number;
  readonly bx: number;
  readonly by: number;
  readonly cx: number;
  readonly cy: number;

  constructor(
    ax: number,
    ay: number,
    bx: number,
    by: number,
    cx: number,
    cy: number,
  ) {
    super();
    validateCoordinates(ax, ay, bx, by, cx, cy)
    this.ax = ax;
    this.ay = ay;
    this.bx = bx;
    this.by = by;
    this.cx = cx;
    this.cy = cy;
  }
  static valueOf(geometry: Geometry, tolerance: Tolerance): Triangle[] {
    const triangles = []
    forEachTriangle(geometry, tolerance, (ax, ay, bx, by, cx, cy) => {
      triangles.push(new Triangle(ax, ay, bx, by, cx, cy))
    })
    return triangles
  }
  calculateCentroid(): Point {
    return Point.valueOf(
      (this.ax + this.bx + this.cx) / 3,
      (this.ay + this.by + this.cy) / 3,
    );
  }
  calculateBounds(): Rectangle {
    return Rectangle.valueOf([
      this.ax,
      this.ay,
      this.bx,
      this.by,
      this.cx,
      this.cy,
    ]);
  }
  walkPath(pathWalker: PathWalker): void {
    pathWalker.moveTo(this.ax, this.ay);
    pathWalker.lineTo(this.bx, this.by);
    pathWalker.lineTo(this.cx, this.cy);
    pathWalker.closePath();
  }
  toWkt(numberFormatter?: NumberFormatter): string {
    const { ax, ay, bx, by, cx, cy } = this;
    const result = ["POLYGON("];
    ringToWkt([ax, ay, bx, by, cx, cy], numberFormatter, false, result);
    result.push(")");
    return result.join("");
  }
  toGeoJson(): GeoJsonPolygon {
    const { ax, ay, bx, by, cx, cy } = this;
    return {
      type: "Polygon",
      coordinates: [
        [
          [ax, ay],
          [bx, by],
          [cx, cy],
          [ax, ay],
        ],
      ],
    };
  }
  calculateNormalized(): Triangle {
    let { ax, ay, bx, by, cx, cy } = this;
    let updated = false;
    while (
      comparePointsForSort(ax, ay, bx, by) > 0 ||
      comparePointsForSort(ax, ay, cx, cy) > 0
    ) {
      [ax, ay, bx, by, cx, cy] = [bx, by, cx, cy, ax, ay];
      updated = true;
    }
    return updated ? new Triangle(ax, ay, bx, by, cx, cy) : this;
  }
  isValid(): boolean {
    return this.isNormalized();
  }
  transform(transformer: Transformer): Geometry {
    const { ax, ay, bx, by, cx, cy } = this;
    return Triangle.valueOf.apply(
      transformer.transformAll([ax, ay, bx, by, cx, cy]),
    );
  }
  generalize(tolerance: Tolerance): Geometry {
    if (this.getBounds().isCollapsible(tolerance)) {
      return this.getCentroid();
    }
    return this;
  }
  relatePoint(x: number, y: number, tolerance: Tolerance): Relation {
    const { ax, ay, bx, by, cx, cy } = this;
    const ab = signedPerpendicularDistance(x, y, ax, ay, bx, by);
    const bc = signedPerpendicularDistance(x, y, bx, by, cx, cy);
    const ca = signedPerpendicularDistance(x, y, cx, cy, ax, ay);
    const outside = -tolerance.tolerance;
    if (ab < outside || bc < outside || ca < outside) {
      return DISJOINT;
    }
    const inside = tolerance.tolerance;
    if (ab > inside && bc > inside && ca > inside) {
      return B_INSIDE_A;
    }
    let result = TOUCH;
    if (ab > inside || bc > inside || ca > inside) {
      result |= B_INSIDE_A;
    }
    return result;
  }
}

interface Bisector{
  a: Vertex
  b: Vertex
  score: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TriangleConsumer = (ax, ay, bx, by, cx, cy) => any

export function forEachTriangle(geometry: Geometry, tolerance: Tolerance, consumer: TriangleConsumer) {
  const pathWalker = MeshPathWalker.valueOf(tolerance)
  geometry.walkPath(pathWalker)
  const [mesh] = pathWalker.getMeshes()
  const vertices = mesh.getVertices()
  let i = 0;
  while (true) {
      const { a, b } = getBestBisector(vertices, mesh, geometry)
      if(!a){
          // Mesh is now full of triangles!
          mesh.forEachLinearRing((coordinates) => consumer(
              coordinates[0], coordinates[1],
              coordinates[2], coordinates[3],
              coordinates[4], coordinates[5],
          ))
          return
      }
      if(i++ > 100){
        throw new Error("runaway")
      }
      mesh.addLink(a.x, a.y, b.x, b.y)
  }
}

function getBestBisector(vertices: Vertex[], mesh: Mesh, geometry: Geometry): Bisector {
  const { length } = vertices
  let bisector = { a: null, b: null, score: Infinity }
  for (let i = 0; i < length; i++) {
      const a = vertices[i]
      for (let b = i - 1; b >= 0; b--) {
          if (!populateBisector(a, vertices[b], mesh, geometry, bisector)) {
              break
          }
      }
      for (let b = i + 1; b < length; b++) {
          if (!populateBisector(a, vertices[b], mesh, geometry, bisector)) {
              break
          }
      }
  }
  return bisector
}

function populateBisector(a: Vertex, b: Vertex, mesh: Mesh, geometry: Geometry, bisector: Bisector): boolean {
  const score = getBisectorScore(a, b, mesh, geometry)
  if (score < bisector.score) {
      bisector.a = a
      bisector.b = b
      bisector.score = score
  }
  return ((a.x - b.x) ** 2 < bisector.score)
}

function getBisectorScore(a: Vertex, b: Vertex, mesh: Mesh, geometry: Geometry): number {
  if(a.links.includes(b)){
      return Infinity // Can't link when we are already linked!
  }
  const { x: ax, y: ay} = a
  const { x: bx, y: by} = b
  const intersections = mesh.getIntersections(ax, ay, bx, by)
  if(intersections.length > 4){
      return Infinity // Can't draw links which cross existing links
  }
  const cx = (ax + bx) / 2
  const cy = (ay + by) / 2
  if (geometry.relatePoint(cx, cy, mesh.tolerance) === DISJOINT) {
      return Infinity // Can't draw links which go outside the shape
  }
  const score = (bx - ax) ** 2 + (by - ay) ** 2
  return score
}