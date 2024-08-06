import { Relation } from "../Relation";
import { Tolerance } from "../Tolerance";
import { NumberFormatter } from "../formatter";
import { GeoJsonGeometry } from "../geoJson";
import { PathWalker } from "../path/PathWalker";
import { Transformer } from "../transformer/Transformer";
import { Point, Rectangle } from "./";

/**
 * Interface describing a geometry. Geometries are typically immutable
 */
export interface Geometry {
  getCentroid(): Point;
  getBounds(): Rectangle;

  walkPath(pathWalker: PathWalker): void;
  toWkt(numberFormatter?: NumberFormatter): string;
  toGeoJson(): GeoJsonGeometry;
  isValid(tolerance: Tolerance): boolean;
  isNormalized(): boolean;
  normalize(): Geometry;
  transform(transformer: Transformer): Geometry;
  generalize(tolerance: Tolerance): Geometry;
  relatePoint(x: number, y: number, tolerance: Tolerance): Relation;
  relate(other: Geometry, tolerance: Tolerance): Relation;

  union(other: Geometry, tolerance: Tolerance): Geometry;
  intersection(other: Geometry, tolerance: Tolerance): Geometry | null;
  less(other: Geometry, tolerance: Tolerance): Geometry | null;
  xor(other: Geometry, tolerance: Tolerance): Geometry | null;
}
