import {
  compareCoordinatesForSort,
  comparePointsForSort,
  CoordinateConsumer,
  crossProduct,
  forEachCoordinate,
  forEachLineSegmentCoordinates,
  forEachPointCoordinate,
  InvalidCoordinateError,
  LineSegmentCoordinatesConsumer,
  reverse,
  validateCoordinates,
} from "../coordinate";
import { NUMBER_FORMATTER, NumberFormatter } from "../formatter";
import { Mesh } from "../mesh/Mesh";
import { PathWalker } from "../path/PathWalker";
import {
  A_OUTSIDE_B,
  B_INSIDE_A,
  DISJOINT,
  Relation,
  TOUCH,
} from "../Relation";
import { Tolerance } from "../Tolerance";
import { Transformer } from "../transformer/Transformer";
import { AbstractGeometry } from "./AbstractGeometry";
import { Geometry } from "./Geometry";
import {
  intersectionLineSegment,
  pointTouchesLineSegment,
} from "./LineSegment";
import { douglasPeucker, walkPath } from "./LineString";
import { Point, Polygon, Rectangle } from "./";
import { GeoJsonPolygon } from "../geoJson";

/**
 * A linear is a non self intersecting closed line string. The first coordinate is not
 * repeated at the end of the coordinate array.
 */
export class LinearRing extends AbstractGeometry {
  readonly coordinates: ReadonlyArray<number>;
  private polygon?: Polygon;
  private convexRings: ReadonlyArray<LinearRing>;
  private area?: number;

  constructor(coordinates: ReadonlyArray<number>) {
    super();
    if (coordinates.length < 6) {
      throw new InvalidCoordinateError(coordinates);
    }
    validateCoordinates(...coordinates);
    this.coordinates = coordinates;
  }
  static fromMesh(mesh: Mesh): LinearRing[] {
    const results = [];
    mesh.forEachLinearRing((coordinates) => {
      results.push(new LinearRing(coordinates));
    });
    return results;
  }
  protected calculateCentroid(): Point {
    return calculateCentroid(this.coordinates);
  }
  protected calculateBounds(): Rectangle {
    return Rectangle.valueOf(this.coordinates);
  }
  getArea(): number {
    let { area } = this;
    if (area == null) {
      this.area = area = calculateArea(this.coordinates);
    }
    return area;
  }
  walkPath(pathWalker: PathWalker): void {
    walkPath(this.coordinates, pathWalker);
    pathWalker.closePath();
  }
  walkPathReverse(pathWalker: PathWalker) {
    walkPathReverse(this.coordinates, pathWalker);
    pathWalker.closePath();
  }
  toWkt(numberFormatter: NumberFormatter = NUMBER_FORMATTER): string {
    const result = ["POLYGON("];
    ringToWkt(this.coordinates, numberFormatter, false, result);
    result.push(")");
    return result.join("");
  }
  toGeoJson(): GeoJsonPolygon {
    const coordinates = [];
    forEachRingCoordinate(this.coordinates, (x, y) => {
      coordinates.push([x, y]);
    });
    return {
      type: "Polygon",
      coordinates,
    };
  }
  isConvex(): boolean {
    return this.getConvexRings().length > 1;
  }
  getConvexRings(): ReadonlyArray<LinearRing> {
    let { convexRings } = this;
    if (!convexRings) {
      const convexRingsCoordinates = [];
      splitToConvex(this.coordinates, convexRingsCoordinates);
      if (convexRingsCoordinates.length === 1) {
        convexRings = [this];
      } else {
        convexRings = convexRingsCoordinates.map((coordinates) => {
          const convexRing = new LinearRing(coordinates);
          convexRing.convexRings = [convexRing];
          return convexRing;
        });
      }
      this.convexRings = convexRings;
    }
    return convexRings;
  }
  getPolygon(): Polygon {
    let { polygon } = this;
    if (!polygon) {
      this.polygon = polygon = new Polygon(this);
    }
    return polygon;
  }
  private getMinIndex(): number {
    const { coordinates } = this;
    let minX = Infinity;
    let minY = Infinity;
    let minIndex = null;
    let i = coordinates.length;
    while (i) {
      const y = coordinates[--i];
      const x = coordinates[--i];
      if (comparePointsForSort(x, y, minX, minY) < 0) {
        minX = x;
        minY = y;
        minIndex = i;
      }
    }
    return minIndex >> 1;
  }
  isValid(tolerance: Tolerance): boolean {
    if (this.getBounds().isCollapsible(tolerance)) {
      return true;
    }
    // A ring is valid if it does not self intersect.
    const { coordinates } = this;
    let startIndex = 2;
    let numberOfLineSegments = coordinates.length >> 1;
    return forEachLineSegmentCoordinates(coordinates, (iax, iay, ibx, iby) => {
      return forEachLineSegmentCoordinates(
        coordinates,
        (jax, jay, jbx, jby) => {
          const intersection = intersectionLineSegment(
            iax,
            iay,
            ibx,
            iby,
            jax,
            jay,
            jbx,
            jby,
            tolerance,
          );
          return !intersection;
        },
        startIndex++,
        numberOfLineSegments--,
      );
    });
  }
  isNormalized(): boolean {
    if (this.getArea() <= 0) {
      return false;
    }
    if (this.getMinIndex()) {
      return false;
    }
    return true;
  }
  calculateNormalized(): LinearRing {
    let { coordinates } = this;
    const minIndex = this.getMinIndex();
    if (minIndex) {
      const c = coordinates.slice(minIndex);
      c.push(...coordinates.slice(0, minIndex));
      coordinates = c;
    }
    const area = this.getArea();
    if (area <= 0) {
      coordinates = reverse(coordinates);
    }
    if (coordinates === this.coordinates) {
      return this;
    }
    return new LinearRing(coordinates);
  }
  transform(transformer: Transformer): LinearRing {
    const coordinates = transformer.transformAll(this.coordinates);
    return new LinearRing(coordinates).normalize() as LinearRing;
  }
  generalize(tolerance: Tolerance): Geometry {
    if (this.getBounds().isCollapsible(tolerance)) {
      return this.getCentroid();
    }
    const { coordinates } = this;
    const generalized = douglasPeucker(coordinates, tolerance.tolerance);
    if (generalized.length === coordinates.length) {
      return this;
    }
    return new LinearRing(generalized);
  }
  relatePoint(x: number, y: number, tolerance: Tolerance): Relation {
    return relateRingToPoint(this.coordinates, x, y, tolerance);
  }
}

export function forEachRingCoordinate(
  shell: ReadonlyArray<number>,
  consumer: CoordinateConsumer,
  reverse: boolean = false,
): number {
  if (!reverse) {
    return forEachCoordinate(shell, consumer, 0, (shell.length >> 1) + 1);
  }
  if (consumer(shell[0], shell[1]) === false) {
    return 0;
  }
  let index = shell.length;
  while (index) {
    const y = shell[--index];
    const x = shell[--index];
    const result = consumer(x, y);
    if (result === false) {
      return index;
    }
  }
}

export function forEachRingLineSegmentCoordinates(
  shell: ReadonlyArray<number>,
  consumer: LineSegmentCoordinatesConsumer,
  reverse: boolean = false,
): boolean | void {
  if (!reverse) {
    return forEachLineSegmentCoordinates(shell, consumer, 0, shell.length >> 1);
  }
  let bx = shell[0];
  let by = shell[1];
  let index = shell.length;
  while (index) {
    const ay = shell[--index];
    const ax = shell[--index];
    const result = consumer(ax, ay, bx, by);
    if (result === false) {
      return result;
    }
    bx = ax;
    by = ay;
  }
}

export function calculateCentroid(coordinates: ReadonlyArray<number>): Point {
  let xSum = 0;
  let ySum = 0;
  let area = 0;
  forEachLineSegmentCoordinates(
    coordinates,
    (ax, ay, bx, by) => {
      const a = ax * by - bx * ay;
      area += a;
      xSum += (ax + bx) * a;
      ySum += (ay + by) * a;
    },
    0,
    coordinates.length >> 1,
  );
  area *= 0.5;
  const cx = xSum / (6 * area);
  const cy = ySum / (6 * area);
  return Point.valueOf(cx, cy);
}

export function ringToWkt(
  coordinates: ReadonlyArray<number>,
  numberFormatter: NumberFormatter,
  reverse: boolean,
  result: string[],
) {
  result.push("(");
  forEachRingCoordinate(
    coordinates,
    (x, y) => {
      result.push(numberFormatter(x), " ", numberFormatter(y), ", ");
    },
    reverse,
  );
  result.pop();
  result.push(")");
}

export function isPointInRing(
  x: number,
  y: number,
  coordinates: ReadonlyArray<number>,
): boolean {
  let inside = false;
  forEachRingLineSegmentCoordinates(coordinates, (ax, ay, bx, by) => {
    const intersect =
      ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax;
    if (intersect) {
      inside = !inside;
    }
  });
  return inside;
}

export function relateRingToPoint(
  coordinates: ReadonlyArray<number>,
  x: number,
  y: number,
  tolerance: Tolerance,
): Relation {
  let touch = false;
  let inside = false;
  forEachRingLineSegmentCoordinates(coordinates, (ax, ay, bx, by) => {
    const intersect =
      ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax;
    if (intersect) {
      inside = !inside;
    }
    touch = pointTouchesLineSegment(x, y, ax, ay, bx, by, tolerance);
    return !touch;
  });
  if (touch) {
    return (TOUCH | A_OUTSIDE_B) as Relation;
  }
  return inside ? (B_INSIDE_A | A_OUTSIDE_B) as Relation : DISJOINT;
}

export function forEachAngle(
  coordinates: ReadonlyArray<number>,
  consumer: (
    ax: number,
    ay: number,
    bx: number,
    by: number,
    cx: number,
    cy: number,
  ) => boolean | void,
) {
  const { length } = coordinates;
  let ax = coordinates[length - 2];
  let ay = coordinates[length - 1];
  let bx = coordinates[0];
  let by = coordinates[1];
  forEachCoordinate(
    coordinates,
    (cx, cy) => {
      if (consumer(ax, ay, bx, by, cx, cy) === false) {
        return;
      }
      ax = bx;
      ay = by;
      bx = cx;
      by = cy;
    },
    1,
    length >> 1,
  );
}

export function isConvex(coordinates: ReadonlyArray<number>): boolean {
  let result = true;
  forEachAngle(
    coordinates,
    (
      ax: number,
      ay: number,
      bx: number,
      by: number,
      cx: number,
      cy: number,
    ) => {
      result = crossProduct(ax, ay, bx, by, cx, cy) >= 0;
      return result;
    },
  );
  return result;
}

export function splitToConvex(
  coordinates: ReadonlyArray<number>,
  result: ReadonlyArray<number>[],
) {
  const splitStart = getSplitStart(coordinates);
  if (splitStart == null) {
    result.push(coordinates);
    return;
  }
  const splitEnd = getSplitEnd(coordinates, splitStart);
  const a = coordinates.slice(0, splitStart.index + 2);
  const b = coordinates.slice(splitStart.index, splitEnd + 2);
  a.push.apply(coordinates.slice(splitEnd));
  splitToConvex(a, result);
  splitToConvex(b, result);
}

interface SplitStart {
  index: number;
  ax: number;
  ay: number;
  bx: number;
  by: number;
}

function getSplitStart(coordinates: ReadonlyArray<number>): SplitStart {
  const { length } = coordinates;
  let result = null;
  let index = length - 2;
  forEachAngle(coordinates, (ax, ay, bx, by, cx, cy) => {
    index += 2;
    if (crossProduct(ax, ay, bx, by, cx, cy) < 0) {
      index %= length;
      result = { index, ax, ay, bx, by };
    }
    return result == null;
  });
  return result;
}

function getSplitEnd(
  coordinates: ReadonlyArray<number>,
  splitStart: SplitStart,
): number {
  // Get the point closest to b that is on the left side of the line
  const { ax, ay, bx, by } = splitStart;
  let minDistSq = Infinity;
  let minIndex = undefined;
  let index = splitStart.index + 2;
  forEachPointCoordinate(
    coordinates,
    (x, y) => {
      if (crossProduct(ax, ay, bx, by, x, y) >= 0) {
        const distSq = (x - bx) ** 2 + (y - by) ** 2;
        if (distSq < minDistSq) {
          minDistSq = distSq;
          minIndex = index;
        }
        index += 2;
      }
    },
    index,
    coordinates.length - index,
  );
  return minIndex;
}

export function calculateArea(coordinates: ReadonlyArray<number>): number {
  let area = 0;
  forEachRingLineSegmentCoordinates(coordinates, (ax, ay, bx, by) => {
    area += ax * by - bx * ay;
  });
  area /= 2;
  return area;
}

export function walkPathReverse(
  coordinates: ReadonlyArray<number>,
  pathWalker: PathWalker,
) {
  const { length } = coordinates;
  pathWalker.moveTo(coordinates[0], coordinates[1]);
  let index = length;
  while (index) {
    const y = coordinates[--index];
    const x = coordinates[--index];
    pathWalker.lineTo(x, y);
  }
}

export function compareLinearRingsForSort(a: LinearRing, b: LinearRing) {
  return compareCoordinatesForSort(a.coordinates, b.coordinates);
}
