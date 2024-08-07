import { Coordinates, reverse } from "../../coordinate";
import {
  calculateArea,
  GeometryCollection,
  LinearRing,
  LineString,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Point,
  Polygon,
} from "..";
import { GeometryFactory } from ".";

export class DefaultGeometryFactory implements GeometryFactory {
  createPoint(x: number, y: number): Point {
    return Point.valueOf(x, y);
  }
  createMultiPoint(points: Coordinates): MultiPoint {
    return new MultiPoint(points);
  }
  createLineString(coordinates: Coordinates): LineString {
    return new LineString(coordinates);
  }
  createMultiLineString(
    lineStrings: ReadonlyArray<Coordinates>,
  ): MultiLineString {
    return new MultiLineString(lineStrings.map((c) => new LineString(c)));
  }
  createPolygon(
    shell: Coordinates,
    holes?: ReadonlyArray<Coordinates>,
  ): Polygon {
    return new Polygon(
      createLinearRing(shell, false),
      holes && holes.map((hole) => createLinearRing(hole, true)),
    );
  }
  createMultiPolygon(
    polygons: ReadonlyArray<ReadonlyArray<Coordinates>>,
  ): MultiPolygon {
    return new MultiPolygon(
      polygons.map((rings) => this.createPolygon(rings[0], rings.slice(1))),
    );
  }
  createGeometryCollection(
    points?: Coordinates,
    lineStrings?: ReadonlyArray<Coordinates>,
    polygons?: ReadonlyArray<ReadonlyArray<Coordinates>>,
  ): GeometryCollection {
    return new GeometryCollection(
      points && points.length && this.createMultiPoint(points),
      lineStrings &&
        lineStrings.length &&
        this.createMultiLineString(lineStrings),
      polygons && polygons.length && this.createMultiPolygon(polygons),
    );
  }
}

function createLinearRing(coordinates: Coordinates, reversed: boolean) {
  let shell = coordinates.slice();
  const { length } = shell;
  if (shell[0] == shell[length - 2] && shell[1] == shell[length - 1]) {
    shell.length = shell.length - 2;
  }
  const negativeArea = calculateArea(shell) > 0;
  if (negativeArea === reversed) {
    shell = reverse(shell);
  }
  return new LinearRing(shell);
}
