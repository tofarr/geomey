import {
  GeoJsonGeometry,
  GeoJsonGeometryCollection,
  GeoJsonLineString,
  GeoJsonMultiLineString,
  GeoJsonMultiPoint,
  GeoJsonMultiPolygon,
  GeoJsonPoint,
  GeoJsonPolygon,
} from "../geoJson";
import { Geometry, Point } from "../geom";
import { GeometryFactory } from "../geom/factory";
import { DefaultGeometryFactory } from "../geom/factory/DefaultGeometryFactory";

export class GeoJsonParser {
  private factory: GeometryFactory;

  constructor(factory?: GeometryFactory) {
    this.factory = factory || new DefaultGeometryFactory();
  }

  parse(input: GeoJsonGeometry): Geometry {
    const parsed = this[`parse${input.type}`](input);
    return parsed;
  }

  parsePoint(input: GeoJsonPoint): Point {
    const { coordinates } = input;
    return this.factory.createPoint(coordinates[0], coordinates[1]);
  }
  parseMultiPoint(input: GeoJsonMultiPoint): Geometry {
    return this.factory.createMultiPoint(input.coordinates.flat(1));
  }
  LineString(input: GeoJsonLineString): Geometry {
    return this.factory.createLineString(input.coordinates.flat(1));
  }
  MultiLineString(input: GeoJsonMultiLineString): Geometry {
    return this.factory.createMultiLineString(
      input.coordinates.map((coordinates) => coordinates.flat(1)),
    );
  }
  Polygon(input: GeoJsonPolygon): Geometry {
    const coordinates = input.coordinates.map((coordinates) =>
      coordinates.flat(1),
    );
    return this.factory.createPolygon(coordinates[0], coordinates.slice(1));
  }
  MultiPolygon(input: GeoJsonMultiPolygon): Geometry {
    const polygons = input.coordinates.map((polygon) =>
      polygon.map((ring) => ring.flat(1)),
    );
    return this.factory.createMultiPolygon(polygons);
  }
  GeometryCollection(input: GeoJsonGeometryCollection): Geometry {
    const points = [];
    const lineStrings = [];
    const polygons = [];
    for (const geometry of input.geometries) {
      switch (geometry.type) {
        case "Point":
          points.push(...geometry.coordinates);
          break;
        case "MultiPoint":
          points.push(...geometry.coordinates.flat(1));
          break;
        case "LineString":
          points.push(geometry.coordinates.flat(1));
          break;
        case "MultiLineString":
          lineStrings.push(
            ...geometry.coordinates.map((lineString) => lineString.flat(1)),
          );
          break;
        case "Polygon":
          polygons.push(
            geometry.coordinates.map((linearRing) => linearRing.flat(1)),
          );
          break;
        case "MultiPolygon":
          polygons.push(
            ...geometry.coordinates.map((polygon) =>
              polygon.map((linearRing) => linearRing.flat(1)),
            ),
          );
          break;
        default:
          throw new Error(`unknown_type:${geometry.type}`);
      }
    }
    return this.factory.createGeometryCollection(points, lineStrings, polygons);
  }
}
