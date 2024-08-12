import { Geometry, Point } from "../";
import { Coordinates } from "../../coordinate";

export interface GeometryFactory {
  createPoint(x: number, y: number): Point;
  createMultiPoint(points: Coordinates): Geometry;
  createLineString(coordinates: Coordinates): Geometry;
  createMultiLineString(lineStrings: ReadonlyArray<Coordinates>): Geometry;
  createPolygon(
    shell: Coordinates,
    holes?: ReadonlyArray<Coordinates>,
  ): Geometry;
  createMultiPolygon(
    polygons: ReadonlyArray<ReadonlyArray<Coordinates>>,
  ): Geometry;
  createGeometryCollection(
    points?: Coordinates,
    lineStrings?: ReadonlyArray<Coordinates>,
    polygons?: ReadonlyArray<ReadonlyArray<Coordinates>>,
  ): Geometry;
}
