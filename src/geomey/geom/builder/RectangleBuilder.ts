import { forEachCoordinate } from "../../coordinate";
import { IRectangle, Rectangle } from "../Rectangle";

export class RectangleBuilder {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;

  constructor(
    minX: number = Infinity,
    minY: number = Infinity,
    maxX: number = -Infinity,
    maxY: number = -Infinity,
  ) {
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
  }
  reset() {
    this.minX = Infinity;
    this.minY = Infinity;
    this.maxX = -Infinity;
    this.maxY = -Infinity;
    return this;
  }
  union(x: number, y: number): RectangleBuilder {
    this.minX = Math.min(this.minX, x);
    this.minY = Math.min(this.minY, y);
    this.maxX = Math.max(this.maxX, x);
    this.maxY = Math.max(this.maxY, y);
    return this;
  }
  unionCoordinates(coordinates: ReadonlyArray<number>): RectangleBuilder {
    forEachCoordinate(coordinates, (x, y) => {
      this.union(x, y);
    });
    return this;
  }
  unionRectangle(rectangle: IRectangle): RectangleBuilder {
    this.union(rectangle.minX, rectangle.minY);
    this.union(rectangle.maxX, rectangle.maxY);
    return this;
  }
  intersection(rectangle: IRectangle): RectangleBuilder {
    this.minX = Math.min(this.minX, rectangle.minX);
    this.minY = Math.min(this.minY, rectangle.minY);
    this.maxX = Math.max(this.maxX, rectangle.maxX);
    this.maxY = Math.max(this.maxY, rectangle.maxY);
    return this;
  }
  intersectsPoint(x: number, y: number): boolean {
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
  build(): Rectangle | void {
    const { minX, minY, maxX, maxY } = this;
    if (minX > maxX && minY > maxY) {
      return null;
    }
    return new Rectangle(minX, minY, maxX, maxY);
  }
}
