import { GeoJsonGeometry, GeoJsonGeometryCollection, GeoJsonLineString, GeoJsonMultiLineString, GeoJsonMultiPoint, GeoJsonMultiPolygon, GeoJsonPoint, GeoJsonPolygon } from ".";
import { forEachLineSegmentCoordinates } from "../coordinate";
import { createGeometryCollection, createPolygons, Geometry, LineString, GeometryCollection, Point, Polygon } from "../geom";
import { Mesh } from "../mesh/Mesh";
import { MeshPathWalker } from "../mesh/MeshPathWalker";
import { Tolerance } from "../Tolerance";

export function parseGeoJson(input: GeoJsonGeometry, tolerance?: Tolerance) {
  const typeParsers = tolerance ? validatingTypeParsers : unsafeTypeParsers;
  const parsed = typeParsers[input.type](input, tolerance);
  return parsed;
}

interface TypeParsers {
  Point(input: GeoJsonPoint): Point;
  MultiPoint(
    input: GeoJsonMultiPoint,
    tolerance: Tolerance,
  ): Point | GeometryCollection;
  LineString(
    input: GeoJsonLineString,
    tolerance: Tolerance,
  ): LineString | GeometryCollection;
  MultiLineString(
    input: GeoJsonMultiLineString,
    tolerance: Tolerance,
  ): LineString | GeometryCollection;
  Polygon(
    input: GeoJsonPolygon,
    tolerance: Tolerance,
  ): Polygon | GeometryCollection;
  MultiPolygon(
    input: GeoJsonMultiPolygon,
    tolerance: Tolerance,
  ): Polygon | GeometryCollection;
  GeometryCollection(
    input: GeoJsonGeometryCollection,
    tolerance: Tolerance,
  ): Geometry;
}

const validatingTypeParsers: TypeParsers = {
  Point(input: GeoJsonPoint): Point {
    return Point.valueOf.apply(Point, input.coordinates);
  },
  MultiPoint(
    input: GeoJsonMultiPoint,
    tolerance: Tolerance,
  ): Point | GeometryCollection {
    return GeometryCollection.valueOf(tolerance, input.coordinates.flat(1)).simplify();
  },
  LineString(input: GeoJsonLineString, tolerance: Tolerance): LineString | GeometryCollection {
    const coordinates = input.coordinates.flat(1)
    const lineStrings = [LineString.unsafeValueOf(coordinates)];
    const geometry = GeometryCollection.valueOf(
      tolerance,
      undefined,
      lineStrings,
    ).simplify();
    return geometry;
  },
  MultiLineString(
    input: GeoJsonMultiLineString,
    tolerance: Tolerance,
  ): Geometry {
    const lineStrings = input.coordinates.map(c => LineString.unsafeValueOf(c.flat(1)))
    return GeometryCollection.valueOf(tolerance, undefined, lineStrings),
  },
  Polygon(
    input: GeoJsonPolygon,
    tolerance: Tolerance,
  ): Geometry {
    const mesh = new Mesh(tolerance);
    for(const positions of input.coordinates){
      const coordinates = positions.flat(1)
      forEachLineSegmentCoordinates(coordinates, (ax, ay, bx, by) => {
        mesh.addLink(ax, ay, bx, by);
      });
    }
    const polygons = createPolygons(mesh);
    const result = GeometryCollection.unsafeValueOf(
      undefined,
      undefined,
      polygons,
    ).simplify();
    return result;
  },
  MultiPolygon(
    input: GeoJsonMultiPolygon,
    tolerance: Tolerance,
  ): Geometry {
    const mesh = new Mesh(tolerance);
    for(const polygon of input.coordinates){
      for(const ring of polygon){
        const coordinates = ring.flat(1)
        forEachLineSegmentCoordinates(coordinates, (ax, ay, bx, by) => {
          mesh.addLink(ax, ay, bx, by);
        });
      }
    }
    const polygons = createPolygons(mesh);
    const result = GeometryCollection.unsafeValueOf(
      undefined,
      undefined,
      polygons,
    ).simplify();
    return result;
  },
  GeometryCollection(
    input: GeoJsonGeometryCollection,
    tolerance: Tolerance,
  ): Geometry {
    const walker = MeshPathWalker.valueOf(tolerance);
    for (const geometry of input.geometries){
      const geometry = unsafeTypeParsers[geometry.type](
        input,
        tolerance,
      );
      geometry.walkPath(walker);
    }
    const [rings, linesAndPoints] = walker.getMeshes();
    return createGeometryCollection(rings, linesAndPoints);
  },
};

const unsafeTypeParsers: TypeParsers = {
  point(input: string, position: number): [Geometry, number] {
    let mid = input.indexOf(" ", position);
    const x = parseFloat(input.substring(position, mid).trim());
    mid++;
    const end = input.indexOf(")", mid);
    const y = parseFloat(input.substring(mid, end).trim());
    return [Point.valueOf(x, y), end + 1];
  },
  multipoint(input: string, position: number): [Geometry, number] {
    const [coordinates, next] = parseCoordinates(input, position);
    return [GeometryCollection.unsafeValueOf(coordinates), next];
  },
  linestring(input: string, position: number): [Geometry, number] {
    const [coordinates, next] = parseCoordinates(input, position);
    return [LineString.unsafeValueOf(coordinates), next];
  },
  multilinestring(input: string, position: number): [Geometry, number] {
    const lineStrings = [];
    while (input[position] == "(") {
      const [coordinates, next] = parseCoordinates(input, position);
      lineStrings.push(LineString.unsafeValueOf(coordinates));
      position = next;
    }
    return [GeometryCollection.unsafeValueOf(undefined, lineStrings), position + 1];
  },
  polygon(input: string, position: number): [Geometry, number] {
    const rings = [];
    while (input[position] == "(") {
      const [coordinates, next] = parseCoordinates(input, position + 1);
      coordinates.length = coordinates.length - 2;
      rings.push(LinearRing.unsafeValueOf(coordinates));
      position = next;
    }
    const result = Polygon.unsafeValueOf(rings[0], rings.slice(1));
    return [result, position + 1];
  },
  multipolygon(input: string, position: number): [Geometry, number] {
    const polygons = [];
    while (input[position] == "(") {
      position++;
      const polygon = unsafeTypeParsers.polygon(input, position, null);
      polygons.push(polygon);
    }
    const result = GeometryCollection.unsafeValueOf(
      undefined,
      undefined,
      polygons,
    ).simplify();
    return [result, position + 1];
  },
  geometrycollection(input: string, position: number): [Geometry, number] {
    const coordinates = [];
    const lineStrings = [];
    const polygons = [];
    while (input[position] != ")") {
      const [type, start] = parseType(input, position);
      const [geometry, end] = unsafeTypeParsers[type](input, start + 1, null);
      if (geometry instanceof Point) {
        coordinates.push(geometry.x, geometry.y);
      } else if (geometry instanceof LineString) {
        lineStrings.push(geometry);
      } else if (geometry instanceof Polygon) {
        polygons.push(geometry);
      }
      position = end;
    }
    return [
      GeometryCollection.unsafeValueOf(coordinates, lineStrings, polygons),
      position + 1,
    ];
  },
};
