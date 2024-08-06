import {
  AbstractGeometry,
  coordinatesToWkt,
  Geometry,
  getCentroid,
  Point,
  Rectangle,
} from ".";
import {
  appendChanged,
  comparePointsForSort,
  Coordinates,
  forEachCoordinate,
  forEachLineSegmentCoordinates,
  InvalidCoordinateError,
  isNaNOrInfinite,
  sortCoordinates,
  validateCoordinates,
} from "../coordinate";
import { NumberFormatter } from "../formatter";
import { GeoJsonMultiPoint } from "../geoJson";
import { Mesh } from "../mesh/Mesh";
import { PathWalker } from "../path/PathWalker";
import {
  A_OUTSIDE_B,
  B_OUTSIDE_A,
  DISJOINT,
  flipAB,
  Relation,
  TOUCH,
  UNKNOWN,
} from "../Relation";
import { Tolerance } from "../Tolerance";
import { Transformer } from "../transformer/Transformer";
import { relate } from "./op/relate";

export class MultiPoint extends AbstractGeometry {
  readonly coordinates: Coordinates;
  private coordinateSet?: Set<string>;
  private coordinateSetTolerance?: Tolerance;

  constructor(coordinates: Coordinates) {
    super();
    validateCoordinates(...coordinates);
    if (!coordinates.length) {
      throw new InvalidCoordinateError(coordinates);
    }
    this.coordinates = coordinates;
  }
  static fromMesh(mesh: Mesh): MultiPoint | null {
    const coordinates = [];
    mesh.forEachVertex((vertex) => {
      if (!vertex.links) {
        coordinates.push(vertex.x, vertex.y);
      }
    });
    return coordinates.length ? new MultiPoint(coordinates) : null;
  }
  protected calculateCentroid(): Point {
    return getCentroid(this.coordinates);
  }
  protected calculateBounds(): Rectangle {
    return Rectangle.valueOf(this.coordinates);
  }
  walkPath(pathWalker: PathWalker): void {
    forEachCoordinate(this.coordinates, (x, y) => {
      pathWalker.moveTo(x, y);
      pathWalker.lineTo(x, y);
    });
  }
  toWkt(numberFormatter?: NumberFormatter): string {
    const result = ["MULTIPOINT"];
    coordinatesToWkt(this.coordinates, numberFormatter, result);
    return result.join("");
  }
  toGeoJson(): GeoJsonMultiPoint {
    const coordinates = [];
    forEachCoordinate(this.coordinates, (x, y) => {
      coordinates.push([x, y]);
    });
    return {
      type: "MultiPoint",
      coordinates,
    };
  }
  isNormalized(): boolean {
    return forEachLineSegmentCoordinates(
      this.coordinates,
      (ax, ay, bx, by) => comparePointsForSort(ax, ay, bx, by) <= 0,
    ) as boolean;
  }
  calculateNormalized(): MultiPoint | Point {
    if (this.isNormalized()) {
      return this;
    }
    const coordinates = this.coordinates.slice();
    sortCoordinates(coordinates);
    if (coordinates.length == 2) {
      return Point.valueOf(coordinates[0], coordinates[1]);
    }
    return new MultiPoint(coordinates);
  }
  isValid(tolerance: Tolerance): boolean {
    if (!this.coordinates.length) {
      return true;
    }
    const multiPoint = this.normalize() as MultiPoint;
    return forEachLineSegmentCoordinates(
      multiPoint.coordinates,
      (ax, ay, bx, by) => {
        return !(tolerance.match(ax, bx) && tolerance.match(ay, by));
      },
    );
  }
  transform(transformer: Transformer): MultiPoint {
    const coordinates = transformer.transformAll(this.coordinates);
    return new MultiPoint(coordinates);
  }
  generalize(tolerance: Tolerance): MultiPoint | Point {
    const multiPoint = this.normalize() as MultiPoint;
    const coordinates = [];
    forEachCoordinate(multiPoint.coordinates, (x, y) => {
      x = tolerance.normalize(x);
      y = tolerance.normalize(y);
      appendChanged(x, y, tolerance, coordinates);
    });
    if (coordinates.length == 2) {
      return Point.valueOf(coordinates[0], coordinates[1]);
    }
    return new MultiPoint(coordinates);
  }
  private getCoordinateSet(tolerance: Tolerance): Set<string> {
    const { coordinateSetTolerance } = this;
    if (
      coordinateSetTolerance &&
      coordinateSetTolerance.tolerance === tolerance.tolerance
    ) {
      return this.coordinateSet;
    }
    const coordinateSet = (this.coordinateSet = new Set());
    this.coordinateSetTolerance = tolerance;
    forEachCoordinate(this.coordinates, (x, y) => {
      x = tolerance.normalize(x);
      y = tolerance.normalize(y);
      coordinateSet.add(`${x}:${y}`);
    });
    return coordinateSet;
  }
  relatePoint(x: number, y: number, tolerance: Tolerance): Relation {
    const coordinateSet = this.getCoordinateSet(tolerance);
    x = tolerance.normalize(x);
    y = tolerance.normalize(y);
    if (coordinateSet.has(`${x}:${y}`)) {
      if (coordinateSet.size > 1) {
        return (A_OUTSIDE_B | TOUCH) as Relation;
      }
      return TOUCH;
    }
    return DISJOINT;
  }
  relateGeometry(other: Geometry, tolerance: Tolerance): Relation {
    if (other instanceof Point) {
      return this.relatePoint(other.x, other.y, tolerance);
    }
    if (other instanceof MultiPoint) {
      const coordinateSet = this.getCoordinateSet(tolerance);
      const otherCoordinateSet = other.getCoordinateSet(tolerance);
      let result = UNKNOWN;
      for (const key of coordinateSet) {
        result |= otherCoordinateSet.has(key) ? TOUCH : A_OUTSIDE_B;
        if (result === (TOUCH | A_OUTSIDE_B)) {
          break;
        }
      }
      for (const key of otherCoordinateSet) {
        if (!coordinateSet.has(key)) {
          result |= B_OUTSIDE_A;
          return result as Relation;
        }
      }
      return result;
    }
    return relate(this, other, tolerance);
  }
}
