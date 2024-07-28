import { NumberFormatter } from "../formatter";
import { DISJOINT, Relation } from "../Relation";
import { Tolerance } from "../Tolerance";
import { Transformer } from "../transformer/Transformer";
import { Geometry } from "./Geometry";
import { MultiGeometry } from "./MultiGeometry";
import { intersection } from "./op/intersection";
import { less } from "./op/less";
import { relate } from "./op/relate";
import { union } from "./op/union";
import { xor } from "./op/xor";
import { Point } from "./Point";
import { Rectangle } from "./Rectangle";

export abstract class AbstractGeometry implements Geometry {
  protected centroid?: Point;
  protected bounds?: Rectangle;
  protected multiGeometry?: MultiGeometry;
  getCentroid(): Point {
    let { centroid } = this;
    if (!centroid) {
      this.centroid = centroid = this.calculateCentroid();
    }
    return centroid;
  }
  protected abstract calculateCentroid(): Point;
  getBounds(): Rectangle {
    let { bounds } = this;
    if (!bounds) {
      this.bounds = bounds = this.calculateBounds();
    }
    return bounds;
  }
  protected abstract calculateBounds(): Rectangle;
  abstract walkPath(pathWalker: PathWalker): void;
  abstract toWkt(numberFormatter?: NumberFormatter): string;
  abstract toGeoJson(): any;
  abstract transform(transformer: Transformer, tolerance: Tolerance): Geometry;
  abstract generalize(tolerance: Tolerance): Geometry;
  abstract relatePoint(x: number, y: number, tolerance: Tolerance): Relation;
  relate(other: Geometry, tolerance: Tolerance): Relation {
    if (this.getBounds().isDisjointRectangle(other.getBounds(), tolerance)) {
      return DISJOINT;
    }
    if (other instanceof Point) {
      return this.relatePoint(other.x, other.y, tolerance);
    }
    return this.relateGeometry(other, tolerance);
  }
  protected relateGeometry(other: Geometry, tolerance: Tolerance): Relation {
    return relate(this, other, tolerance);
  }
  union(other: Geometry, tolerance: Tolerance): Geometry {
    return union(this, other, tolerance);
  }
  intersection(other: Geometry, tolerance: Tolerance): Geometry | null {
    if (this.getBounds().isDisjointRectangle(other.getBounds(), tolerance)) {
      return null;
    }
    if (other instanceof Point) {
      return this.relate(other, tolerance) === DISJOINT ? null : other;
    }
    return this.intersectionGeometry(other, tolerance);
  }
  protected intersectionGeometry(
    other: Geometry,
    tolerance: Tolerance,
  ): Geometry | null {
    return intersection(this, other, tolerance);
  }
  less(other: Geometry, tolerance: Tolerance): Geometry | null {
    if (this.getBounds().isDisjointRectangle(other.getBounds(), tolerance)) {
      return this;
    }
    return this.lessGeometry(other, tolerance);
  }
  protected lessGeometry(other: Geometry, tolerance: Tolerance): Geometry {
    return less(this, other, tolerance);
  }
  xor(other: Geometry, tolerance: Tolerance): Geometry | null {
    return xor(this, other, tolerance);
  }
}
