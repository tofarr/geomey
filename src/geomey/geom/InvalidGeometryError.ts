import { NUMBER_FORMATTER } from "../formatter";
import { Geometry } from "./";

export class InvalidGeometryError extends Error {
  readonly geometry: Geometry;

  constructor(geometry: Geometry, message?: string) {
    super(message || geometry.toWkt(NUMBER_FORMATTER));
    this.geometry = geometry;
  }
}
