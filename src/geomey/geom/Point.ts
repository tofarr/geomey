import { DISJOINT, Relation, TOUCH, flipAB } from "../Relation";
import { Tolerance } from "../Tolerance";
import { coordinateMatch, isNaNOrInfinite } from "../coordinate";
import { NUMBER_FORMATTER, NumberFormatter } from "../formatter";
import { Mesh } from "../mesh/Mesh";
import { PathWalker } from "../path/PathWalker";
import { Transformer } from "../transformer/Transformer";
import { Geometry, Rectangle } from "./";
import { InvalidGeometryError } from "./InvalidGeometryError";
import { union } from "./op/union";
import { xor } from "./op/xor";

export class Point implements Geometry {
  readonly x: number;
  readonly y: number;
  private bounds?: Rectangle;

  private constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  static valueOf(x: number, y: number): Point {
    const result = new Point(x, y);
    if (isNaNOrInfinite(x, y)) {
      throw new InvalidGeometryError(result);
    }
    return result;
  }
  static unsafeValueOf(x: number, y: number): Point {
    return new Point(x, y);
  }
  getCentroid(): Point {
    return this;
  }
  getBounds(): Rectangle {
    let { bounds } = this;
    if (!bounds) {
      const { x, y } = this;
      bounds = this.bounds = Rectangle.unsafeValueOf(x, y, x, y);
    }
    return bounds;
  }
  walkPath(pathWalker: PathWalker): void {
    const { x, y } = this;
    pathWalker.moveTo(x, y);
    pathWalker.lineTo(x, y);
  }
  toWkt(numberFormatter: NumberFormatter = NUMBER_FORMATTER): string {
    return pointToWkt(this.x, this.y, numberFormatter);
  }
  toGeoJson() {
    return {
      type: "Point",
      coordinates: [this.x, this.y],
    };
  }
  transform(transformer: Transformer): Point {
    const [x, y] = transformer.transform(this.x, this.y);
    return Point.valueOf(x, y);
  }
  generalize(): Geometry {
    return this;
  }
  relatePoint(x: number, y: number, tolerance: Tolerance): Relation {
    return coordinateMatch(this.x, this.y, x, y, tolerance) ? TOUCH : DISJOINT;
  }
  relate(other: Geometry, tolerance: Tolerance): Relation {
    if (other instanceof Point) {
      return this.relatePoint(other.x, other.y, tolerance);
    }
    return flipAB(other.relatePoint(this.x, this.y, tolerance));
  }
  union(other: Geometry, tolerance: Tolerance): Geometry {
    if (other.relatePoint(this.x, this.y, tolerance) !== DISJOINT) {
      return other;
    }
    return union(this, other, tolerance);
  }
  intersection(other: Geometry, tolerance: Tolerance): Geometry | null {
    if (other.relatePoint(this.x, this.y, tolerance) === DISJOINT) {
      return null;
    }
    return this;
  }
  less(other: Geometry, tolerance: Tolerance): Geometry | null {
    return this.intersection(other, tolerance);
  }
  xor(other: Geometry, tolerance: Tolerance): Geometry | null {
    if (other instanceof Point) {
      if (coordinateMatch(this.x, this.y, other.x, other.y, tolerance)) {
        return null;
      }
    }
    return xor(this, other, tolerance);
  }
}

export function createPoints(mesh: Mesh): number[] {
  const coordinates = [];
  mesh.forEachVertex((vertex) => {
    if (!vertex.links) {
      coordinates.push(vertex.x, vertex.y);
    }
  });
  return coordinates;
}

export function pointToWkt(
  x: number,
  y: number,
  numberFormatter: NumberFormatter = NUMBER_FORMATTER,
): string {
  return `POINT (${numberFormatter(this.x)} ${numberFormatter(this.y)})`;
}
