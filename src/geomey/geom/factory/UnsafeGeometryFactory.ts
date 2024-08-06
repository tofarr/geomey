import { Coordinates } from "../../coordinate";
import {
  Geometry,
  GeometryCollection,
  LinearRing,
  LineString,
  Point,
  Polygon,
} from "../";
import { GeometryFactory } from "./";

export class UnsafeGeometryFactory implements GeometryFactory {
  createPoint(x: number, y: number): Point {
    return Point.valueOf(x, y);
  }
  createMultiPoint(points: Coordinates): GeometryCollection {
    return GeometryCollection.unsafeValueOf(points);
  }
  createLineString(coordinates: Coordinates): LineString {
    return LineString.unsafeValueOf(coordinates);
  }
  createMultiLineString(
    lineStrings: ReadonlyArray<Coordinates>,
  ): GeometryCollection {
    return GeometryCollection.unsafeValueOf(
      [],
      lineStrings.map((c) => LineString.unsafeValueOf(c)),
    );
  }
  createPolygon(
    shell: Coordinates,
    holes: ReadonlyArray<Coordinates>,
  ): Polygon {
    let children = null;
    if (holes) {
      children = holes.map((c) => {
        const ring = LinearRing.unsafeValueOf(c.slice(0, c.length - 2));
        return Polygon.unsafeValueOf(ring);
      });
    } else {
      children = [];
    }
    const shellRing = LinearRing.unsafeValueOf(
      shell.slice(0, shell.length - 2),
    );
    return Polygon.unsafeValueOf(shellRing, children);
  }
  createMultiPolygon(
    polygons: ReadonlyArray<ReadonlyArray<Coordinates>>,
  ): GeometryCollection {
    return GeometryCollection.unsafeValueOf(
      [],
      [],
      polygons.map((rings) => this.createPolygon(rings[0], rings.slice(1))),
    );
  }
  createGeometryCollection(
    points?: Coordinates,
    lineStrings?: ReadonlyArray<Coordinates>,
    polygons?: ReadonlyArray<ReadonlyArray<Coordinates>>,
  ): GeometryCollection {
    return GeometryCollection.unsafeValueOf(
      points,
      lineStrings.map((c) => LineString.unsafeValueOf(c)),
      polygons.map((rings) => this.createPolygon(rings[0], rings.slice(1))),
    );
  }
}
