export type GeoJsonPosition = [number, number];

export interface GeoJsonPoint {
  type: "Point";
  coordinates: GeoJsonPosition;
}

export interface GeoJsonMultiPoint {
  type: "MultiPoint";
  coordinates: GeoJsonPosition[];
}

export interface GeoJsonLineString {
  type: "LineString";
  coordinates: GeoJsonPosition[];
}

export interface GeoJsonMultiLineString {
  type: "MultiLineString";
  coordinates: GeoJsonPosition[][];
}

export interface GeoJsonPolygon {
  type: "Polygon";
  coordinates: GeoJsonPosition[][];
}

export interface GeoJsonMultiPolygon {
  type: "MultiPolygon";
  coordinates: GeoJsonPosition[][][];
}

export interface GeoJsonGeometryCollection {
  type: "GeometryCollection";
  geometries: GeoJsonGeometry[];
}

export type GeoJsonGeometry =
  | GeoJsonPoint
  | GeoJsonMultiPoint
  | GeoJsonLineString
  | GeoJsonMultiLineString
  | GeoJsonPolygon
  | GeoJsonMultiPolygon
  | GeoJsonGeometryCollection;
