import { Relation } from "../Relation";
import { Tolerance } from "../Tolerance";
import { NumberFormatter } from "../formatter";
import { PathWalker } from "../path/PathWalker";
import { Transformer } from "../transformer/Transformer";
import { Point } from "./Point";
import { Rectangle } from "./Rectangle";

/**
 * Interface describing a geometry. Geometries are typically immutable
 */
export interface Geometry {
  getCentroid(): Point;
  getBounds(): Rectangle;

  walkPath(pathWalker: PathWalker): void;
  toWkt(numberFormatter?: NumberFormatter): string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toGeoJson(): any;

  transform(transformer: Transformer, tolerance: Tolerance): Geometry;
  generalize(tolerance: Tolerance): Geometry;
  relatePoint(x: number, y: number, tolerance: Tolerance): Relation;
  relate(other: Geometry, tolerance: Tolerance): Relation;

  union(other: Geometry, tolerance: Tolerance): Geometry;
  intersection(other: Geometry, tolerance: Tolerance): Geometry | null;
  less(other: Geometry, tolerance: Tolerance): Geometry | null;
  xor(other: Geometry, tolerance: Tolerance): Geometry | null;
}
