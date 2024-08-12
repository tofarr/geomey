import {
  A_OUTSIDE_B,
  B_OUTSIDE_A,
  Relation,
  TOUCH,
  UNKNOWN,
} from "../Relation";
import { Tolerance } from "../Tolerance";
import {
  appendChanged,
  compareCoordinatesForSort,
  comparePointsForSort,
  CoordinateConsumer,
  coordinateMatch,
  forEachCoordinate,
  forEachLineSegmentCoordinates,
  InvalidCoordinateError,
  LineSegmentCoordinatesConsumer,
  reverse,
  sortCoordinates,
  validateCoordinates,
} from "../coordinate";
import { NUMBER_FORMATTER, NumberFormatter } from "../formatter";
import { Mesh } from "../mesh/Mesh";
import { PathWalker } from "../path/PathWalker";
import { Transformer } from "../transformer/Transformer";
import { AbstractGeometry } from "./AbstractGeometry";
import {
  Geometry,
  getLength,
  intersectionLineSegment,
  LineSegment,
  perpendicularDistance,
  Point,
  pointTouchesLineSegment,
  Rectangle,
  relateLineSegments,
} from "./";
import { relate } from "./op/relate";
import { GeoJsonLineString } from "../geoJson";

/**
 * A line string describes a series of line segments which may or may not self intersect.
 */
export class LineString extends AbstractGeometry {
  readonly coordinates: ReadonlyArray<number>;

  constructor(coordinates: ReadonlyArray<number>) {
    super();
    if (coordinates.length < 4) {
      throw new InvalidCoordinateError(coordinates);
    }
    validateCoordinates(...coordinates);
    this.coordinates = coordinates;
  }
  static fromMesh(mesh: Mesh): LineString[] {
    const results = [];
    mesh.forEachLineString((coordinates) => {
      results.push(new LineString(coordinates));
    });
    return results;
  }
  forEachCoordinate(consumer: CoordinateConsumer): boolean {
    return forEachCoordinate(this.coordinates, consumer);
  }
  forEachLineSegmentCoordinates(
    consumer: LineSegmentCoordinatesConsumer,
  ): boolean {
    return forEachLineSegmentCoordinates(this.coordinates, consumer);
  }
  protected calculateCentroid(): Point {
    return getCentroid(this.coordinates);
  }
  protected calculateBounds(): Rectangle {
    return Rectangle.valueOf(this.coordinates);
  }
  getLength() {
    let length = 0;
    forEachLineSegmentCoordinates(this.coordinates, (ax, ay, bx, by) => {
      length += getLength(ax, ay, bx, by);
    });
    return length;
  }
  walkPath(pathWalker: PathWalker): void {
    walkPath(this.coordinates, pathWalker);
  }
  toWkt(numberFormatter: NumberFormatter = NUMBER_FORMATTER): string {
    if (!this.coordinates.length) {
      return "EMPTY";
    }
    const result = ["LINESTRING"];
    coordinatesToWkt(this.coordinates, numberFormatter, result);
    return result.join("");
  }
  toGeoJson(): GeoJsonLineString {
    const coordinates = [];
    forEachCoordinate(this.coordinates, (x, y) => {
      coordinates.push(x, y);
    });
    return {
      type: "LineString",
      coordinates,
    };
  }
  isValid(tolerance: Tolerance): boolean {
    if (this.getBounds().isCollapsible(tolerance)) {
      return true;
    }
    return forEachLineSegmentCoordinates(this.coordinates, (ax, ay, bx, by) => {
      !coordinateMatch(ax, ay, bx, by, tolerance);
    });
  }
  isNormalized(): boolean {
    const { coordinates } = this;
    const { length } = coordinates;
    const compare =
      comparePointsForSort(
        coordinates[0],
        coordinates[1],
        coordinates[length - 2],
        coordinates[length - 1],
      ) ||
      comparePointsForSort(
        coordinates[2],
        coordinates[3],
        coordinates[length - 4],
        coordinates[length - 3],
      );
    return compare < 0;
  }
  calculateNormalized() {
    if (this.isNormalized()) {
      return this;
    }
    return new LineString(reverse(this.coordinates));
  }
  transform(transformer: Transformer): LineString {
    return new LineString(
      transformer.transformAll(this.coordinates),
    ).normalize() as LineString;
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
    return new LineString(generalized);
  }
  relatePoint(x: number, y: number, tolerance: Tolerance): Relation {
    return relatePointToLineString(x, y, this.coordinates, tolerance);
  }
  relateGeometry(other: Geometry, tolerance: Tolerance): Relation {
    if (other instanceof LineSegment) {
      return relateLineStringToLineSegment(
        this.coordinates,
        other.ax,
        other.ay,
        other.bx,
        other.by,
        tolerance,
      );
    } else if (other instanceof LineString) {
      return relateLineStringToLineString(
        this.coordinates,
        other.coordinates,
        tolerance,
      );
    }
    return relate(this, other, tolerance);
  }
}

export type LineStringConsumer = (lineString: LineString) => boolean | void;

export function getCentroid(coordinates: ReadonlyArray<number>) {
  let x = 0;
  let y = 0;
  const { length } = coordinates;
  let offset = length;
  while (offset) {
    y += coordinates[--offset];
    x += coordinates[--offset];
  }
  return Point.valueOf(x / length, y / length);
}

function partition(
  coordinates: ReadonlyArray<number>,
  startIndex: number,
  endIndex: number,
  tolerance: number,
  target: number[],
) {
  const ax = coordinates[startIndex];
  const ay = coordinates[startIndex + 1];
  if (endIndex - startIndex < 4) {
    target.push(ax, ay);
    return;
  }
  let maxDist = 0;
  let maxIndex = startIndex;
  const bx = coordinates[endIndex];
  const by = coordinates[endIndex + 1];
  let index = startIndex + 2;
  while (index < endIndex) {
    const dist = Math.abs(
      perpendicularDistance(
        coordinates[index++],
        coordinates[index++],
        ax,
        ay,
        bx,
        by,
      ),
    );
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = index;
    }
  }
  if (maxDist <= tolerance) {
    target.push(ax, ay);
    return;
  }
  partition(coordinates, startIndex, maxIndex, tolerance, target);
  partition(coordinates, maxIndex, endIndex, tolerance, target);
}

export function douglasPeucker(
  coordinates: ReadonlyArray<number>,
  tolerance: number,
): number[] {
  const target = [];
  partition(coordinates, 0, coordinates.length - 2, tolerance, target);
  target.push(
    coordinates[coordinates.length - 2],
    coordinates[coordinates.length - 1],
  );
  return target;
}

export function getCoordinatesWithSelfIntersections(
  coordinates: ReadonlyArray<number>,
  tolerance: Tolerance,
): number[] {
  let numberOfLineSegments = coordinates.length >> 1;
  let startIndexInclusive = 2;
  const newCoordinates = [coordinates[0], coordinates[1]];
  const intersections = [];
  forEachLineSegmentCoordinates(coordinates, (iax, iay, ibx, iby) => {
    intersections.length = 0;
    forEachLineSegmentCoordinates(
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
        if (intersection) {
          intersections.push(intersection.x, intersection.y);
        }
      },
      (startIndexInclusive += 2),
      --numberOfLineSegments,
    );
    if ((intersections.length || 0) > 2) {
      sortCoordinates(intersections, (px, py, qx, qy) => {
        const distP = (px - iax) ** 2 + (py - iay) ** 2;
        const distQ = (qx - iax) ** 2 + (qy - iay) ** 2;
        return distP - distQ;
      });
      forEachCoordinate(intersections, (ix, iy) => {
        appendChanged(ix, iy, tolerance, newCoordinates);
      });
    }
    appendChanged(ibx, iby, tolerance, newCoordinates);
  });
  return newCoordinates;
}

export function getCoordinatesWithIntersectionsAgainst(
  coordinates: ReadonlyArray<number>,
  otherCoordinates: ReadonlyArray<number>,
  tolerance: Tolerance,
  numLineSegments?: number,
  otherNumLineSegments?: number,
): ReadonlyArray<number> {
  const newCoordinates = [coordinates[0], coordinates[1]];
  const intersections = [];
  let hasIntersections = false;
  forEachLineSegmentCoordinates(
    coordinates,
    (iax, iay, ibx, iby) => {
      intersections.length = 0;
      forEachLineSegmentCoordinates(
        otherCoordinates,
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
          if (intersection) {
            intersections.push(intersection.x, intersection.y);
          }
        },
        0,
        otherNumLineSegments,
      );
      if ((intersections.length || 0) > 2) {
        sortCoordinates(intersections, (px, py, qx, qy) => {
          const distP = (px - iax) ** 2 + (py - iay) ** 2;
          const distQ = (qx - iax) ** 2 + (qy - iay) ** 2;
          return distP - distQ;
        });
      }
      hasIntersections ||= !!intersections.length;
      forEachCoordinate(intersections, (ix, iy) => {
        appendChanged(ix, iy, tolerance, newCoordinates);
      });
      appendChanged(ibx, iby, tolerance, newCoordinates);
    },
    0,
    numLineSegments,
  );
  return hasIntersections ? newCoordinates : coordinates;
}

export function relatePointToLineString(
  x: number,
  y: number,
  coordinates: ReadonlyArray<number>,
  tolerance: Tolerance,
): Relation {
  let result = A_OUTSIDE_B;
  forEachLineSegmentCoordinates(coordinates, (ax, ay, bx, by) => {
    if (pointTouchesLineSegment(x, y, ax, ay, bx, by, tolerance)) {
      result |= TOUCH;
      return false;
    }
    return true;
  });
  if (result == A_OUTSIDE_B) {
    result |= B_OUTSIDE_A;
  }
  return result;
}

export function relateLineStringToLineSegment(
  coordinates: ReadonlyArray<number>,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  tolerance: Tolerance,
): Relation {
  let result = UNKNOWN;
  forEachLineSegmentCoordinates(coordinates, (jax, jay, jbx, jby) => {
    result |= relateLineSegments(ax, ay, bx, by, jax, jay, jbx, jby, tolerance);
    return result !== (TOUCH | A_OUTSIDE_B | B_OUTSIDE_A);
  });
  return result;
}

export function relateLineStringToLineString(
  coordinates: ReadonlyArray<number>,
  againstCoordinates: ReadonlyArray<number>,
  tolerance: Tolerance,
): Relation {
  let result = UNKNOWN;
  forEachLineSegmentCoordinates(coordinates, (iax, iay, ibx, iby) => {
    forEachLineSegmentCoordinates(againstCoordinates, (jax, jay, jbx, jby) => {
      result |= relateLineSegments(
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
      return result !== (TOUCH | A_OUTSIDE_B | B_OUTSIDE_A);
    });
    return result !== (TOUCH | A_OUTSIDE_B | B_OUTSIDE_A);
  });
  return result;
}

export function walkPath(
  coordinates: ReadonlyArray<number>,
  pathWalker: PathWalker,
) {
  const { length } = coordinates;
  pathWalker.moveTo(coordinates[0], coordinates[1]);
  let index = 2;
  while (index < length) {
    pathWalker.lineTo(coordinates[index++], coordinates[index++]);
  }
}

export function coordinatesToWkt(
  coordinates: ReadonlyArray<number>,
  numberFormatter: NumberFormatter,
  result: string[],
) {
  result.push("(");
  forEachCoordinate(coordinates, (x, y) => {
    result.push(numberFormatter(x), " ", numberFormatter(y), ", ");
  });
  result.pop();
  result.push(")");
}

export function compareLineStringsForSort(
  a: LineString,
  b: LineString,
): number {
  return compareCoordinatesForSort(a.coordinates, b.coordinates);
}
