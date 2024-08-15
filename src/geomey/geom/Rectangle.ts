import {
  A_INSIDE_B,
  A_OUTSIDE_B,
  B_INSIDE_A,
  B_OUTSIDE_A,
  DISJOINT,
  OUTSIDE_TOUCH,
  OVERLAP,
  Relation,
  TOUCH,
  UNKNOWN,
} from "../Relation";
import { Tolerance } from "../Tolerance";
import { validateCoordinates } from "../coordinate";
import { NumberFormatter } from "../formatter";
import { PathWalker } from "../path/PathWalker";
import { Transformer } from "../transformer/Transformer";
import { Geometry, LinearRing, LineSegment, Point, Polygon } from "./";

export interface IRectangle {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export class Rectangle implements Geometry {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
  private centroid?: Point;
  private polygon?: Polygon;

  constructor(minX: number, minY: number, maxX: number, maxY: number) {
    validateCoordinates(minX, minY, maxX, maxY);
    if (maxX < minX) {
      [minX, maxX] = [maxX, minX];
    }
    if (maxY < minY) {
      [minY, maxY] = [maxY, minY];
    }
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
  }
  static valueOf(coordinates: ReadonlyArray<number>): Rectangle | null {
    let { length: offset } = coordinates;
    if (!offset) {
      return null;
    }
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    while (offset) {
      const y = coordinates[--offset];
      const x = coordinates[--offset];
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    return new Rectangle(minX, minY, maxX, maxY);
  }
  getCentroid(): Point {
    let { centroid } = this;
    if (!centroid) {
      centroid = this.centroid = Point.valueOf(
        (this.minX + this.maxX) / 2,
        (this.minY + this.maxY) / 2,
      );
    }
    return centroid;
  }
  getBounds(): Rectangle {
    return this;
  }
  getWidth() {
    return this.maxX - this.minX;
  }
  getHeight() {
    return this.maxY - this.minY;
  }
  getArea(): number {
    return this.getWidth() * this.getHeight();
  }
  isCollapsible(tolerance: Tolerance): boolean {
    return (
      tolerance.match(this.getWidth(), 0) &&
      tolerance.match(this.getHeight(), 0)
    );
  }
  walkPath(pathWalker: PathWalker): void {
    const { minX, minY, maxX, maxY } = this;
    pathWalker.moveTo(minX, minY);
    pathWalker.lineTo(maxX, minY);
    pathWalker.lineTo(maxX, maxY);
    pathWalker.lineTo(minX, maxY);
    pathWalker.closePath();
  }
  toWkt(numberFormatter?: NumberFormatter): string {
    return this.getPolygon().toWkt(numberFormatter);
  }
  toGeoJson() {
    return this.getPolygon().toGeoJson();
  }
  toCoordinates(): number[] {
    const { minX, minY, maxX, maxY } = this;
    return [minX, minY, maxX, minY, maxX, maxY, minX, maxY];
  }
  getPolygon(): Polygon {
    let { polygon } = this;
    if (!polygon) {
      const linearRing = new LinearRing(this.toCoordinates());
      this.polygon = polygon = new Polygon(linearRing);
    }
    return polygon;
  }
  isValid(): boolean {
    return true;
  }
  isNormalized(): boolean {
    return true;
  }
  normalize(): Rectangle | Point | LineSegment {
    const { minX, minY, maxX, maxY } = this;
    if (minX === maxX) {
      if (minY === maxY) {
        return this.getCentroid();
      }
      return new LineSegment(minX, minY, minX, maxY);
    }
    if (minY === maxY) {
      return new LineSegment(minX, minY, maxX, maxY);
    }
    return this;
  }
  transform(transformer: Transformer): Rectangle {
    return Rectangle.valueOf(transformer.transformAll(this.toCoordinates()));
  }
  generalize(tolerance: Tolerance): Geometry {
    if (this.isCollapsible(tolerance)) {
      return this.getCentroid();
    }
    return this;
  }
  instersectsPoint(x: number, y: number): boolean {
    return this.minX <= x && this.minY <= y && this.maxX >= x && this.maxY >= y;
  }
  intersectsRectangle(rectangle: IRectangle): boolean {
    return (
      this.minX <= rectangle.maxX &&
      this.minY <= rectangle.maxY &&
      this.maxX >= rectangle.minX &&
      this.maxY >= rectangle.minY
    );
  }
  relatePoint(x: number, y: number, tolerance: Tolerance): Relation {
    const { minX, minY, maxX, maxY } = this;
    const { tolerance: t } = tolerance;
    if (x + t < minX || y + t < minY || x - t > maxX || y - t > maxY) {
      return DISJOINT;
    }
    let result = UNKNOWN;
    if (
      tolerance.match(x, minX) ||
      tolerance.match(y, minY) ||
      tolerance.match(x, maxX) ||
      tolerance.match(y, maxY)
    ) {
      result = TOUCH;
    }
    if (x + t < maxX || y + t < maxY || x - t > minX || y - t > minY) {
      result |= A_OUTSIDE_B;
    }
    if (x + t < maxX && y + t < maxY && x - t > minX && y - t > minY) {
      result |= B_INSIDE_A;
    }
    return result;
  }
  isDisjointRectangle(rectangle: Rectangle, tolerance: Tolerance): boolean {
    const { minX: aMinX, minY: aMinY, maxX: aMaxX, maxY: aMaxY } = this;
    const { minX: bMinX, minY: bMinY, maxX: bMaxX, maxY: bMaxY } = rectangle;
    const { tolerance: t } = tolerance;
    return (
      aMaxX + t < bMinX ||
      aMaxY + t < bMinY ||
      aMinX - t > bMaxX ||
      aMinY - t > bMaxY
    );
  }
  relateRectangle(rectangle: Rectangle, tolerance: Tolerance): Relation {
    const { minX: aMinX, minY: aMinY, maxX: aMaxX, maxY: aMaxY } = this;
    const { minX: bMinX, minY: bMinY, maxX: bMaxX, maxY: bMaxY } = rectangle;
    const relateX = relateRangeToRange(aMinX, aMaxX, bMinX, bMaxX, tolerance)
    if (relateX == DISJOINT) {
      return DISJOINT
    }
    const relateY = relateRangeToRange(aMinY, aMaxY, bMinY, bMaxY, tolerance)
    if (relateY == DISJOINT) {
      return DISJOINT
    }
    const overlap = relateX & relateY & OVERLAP
    const outside_touch = (relateX | relateY) & OUTSIDE_TOUCH
    return (overlap | outside_touch) as Relation

  }
  relate(other: Geometry, tolerance: Tolerance): Relation {
    return this.relateRectangle(other.getBounds(), tolerance);
  }
  union(other: Geometry): Rectangle {
    const bounds = other.getBounds();
    return new Rectangle(
      Math.min(this.minX, bounds.minX),
      Math.min(this.minY, bounds.minY),
      Math.max(this.maxX, bounds.maxX),
      Math.max(this.maxY, bounds.maxY),
    );
  }
  intersection(other: Geometry, tolerance: Tolerance): Rectangle | null {
    const otherBounds = other.getBounds()
    if (this.isDisjointRectangle(otherBounds, tolerance)){
      return null
    }
    return new Rectangle(
      Math.max(this.minX, otherBounds.minX),
      Math.max(this.minY, otherBounds.minY),
      Math.min(this.maxX, otherBounds.maxX),
      Math.min(this.maxY, otherBounds.maxY),
    );
  }
  less(other: Geometry, tolerance: Tolerance): Geometry | null {
    if (this.getBounds().isDisjointRectangle(other.getBounds(), tolerance)) {
      return this;
    }
    return this.getPolygon().less(other, tolerance);
  }
  xor(other: Geometry, tolerance: Tolerance): Geometry | null {
    return this.getPolygon().xor(other, tolerance);
  }
}

export function relateRangeToRange(aMin: number, aMax: number, bMin: number, bMax: number, tolerance: Tolerance): Relation {
    if (tolerance.lt(aMax, bMin) || tolerance.gt(aMin, bMax)){
      return DISJOINT
    }
    const min = Math.max(aMin, bMin)
    const max = Math.min(aMax, bMax)
    let result = UNKNOWN
    if (!tolerance.match(min, max)){
      result = (A_INSIDE_B | B_INSIDE_A) as Relation
    }
    if (tolerance.lt(aMin, min) || tolerance.gt(aMax, max)){
      result |= A_OUTSIDE_B
    }
    if (tolerance.lt(bMin, min) || tolerance.gt(bMax, max)){
      result |= B_OUTSIDE_A
    }

    if (tolerance.match(aMin, bMin) || tolerance.match(aMax, bMax)) {
      result |= TOUCH
    }
    if ((aMin < bMin) !== (aMax > bMax)) {
      result |= TOUCH
    }
    return result
}
