import { Tolerance } from "./Tolerance";

export class InvalidCoordinateError extends Error {
  constructor(coordinates: Coordinates) {
    super(coordinates.join(" "));
  }
}

export type Coordinates = ReadonlyArray<number>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PointCoordinatesConsumer = (x: number, y: number) => any;

export type LineSegmentCoordinatesConsumer = (
  ax: number,
  ay: number,
  bx: number,
  by: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) => any;

export type LineStringCoordinatesConsumer = (
  coordinates: Coordinates,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) => any;

export type LinearRingCoordinatesConsumer = (
  coordinates: Coordinates,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) => any;

export function forEachPointCoordinate(
  coordinates: Coordinates,
  consumer: PointCoordinatesConsumer,
  startIndexInclusive?: number,
  numberOfPoints?: number,
): boolean {
  if (startIndexInclusive == null) {
    startIndexInclusive = 0;
  }
  const { length } = coordinates;
  if (numberOfPoints == null) {
    numberOfPoints = length >> 1;
  }
  while (--numberOfPoints >= 0) {
    if (startIndexInclusive === length) {
      startIndexInclusive = 0;
    }
    if (
      consumer(
        coordinates[startIndexInclusive++],
        coordinates[startIndexInclusive++],
      ) === false
    ) {
      return false;
    }
  }
  return true;
}

export function forEachLineSegmentCoordinates(
  coordinates: Coordinates,
  consumer: LineSegmentCoordinatesConsumer,
  startIndexInclusive?: number,
  numberOfLineSegments?: number,
): boolean {
  if (startIndexInclusive == null) {
    startIndexInclusive = 0;
  }
  const { length } = coordinates;
  if (numberOfLineSegments == null) {
    numberOfLineSegments = (length >> 1) - 1;
  }
  while (--numberOfLineSegments >= 0) {
    const ax = coordinates[startIndexInclusive++];
    const ay = coordinates[startIndexInclusive++];
    if (startIndexInclusive === length) {
      startIndexInclusive = 0;
    }
    const bx = coordinates[startIndexInclusive];
    const by = coordinates[startIndexInclusive + 1];
    if (consumer(ax, ay, bx, by) === false) {
      return false;
    }
  }
  return true;
}

export function isNaNOrInfinite(...coordinates: Coordinates) {
  for (const n of coordinates) {
    if (Number.isNaN(n) || !Number.isFinite(n)) {
      return true;
    }
  }
  return false;
}

export function validateCoordinates(...coordinates: Coordinates) {
  if (isNaNOrInfinite(...coordinates)) {
    throw new InvalidCoordinateError(coordinates);
  }
}

export function comparePointsForSort(
  ax: number,
  ay: number,
  bx: number,
  by: number,
) {
  return ax - bx || ay - by;
}

export type Comparator = (
  ax: number,
  ay: number,
  bx: number,
  by: number,
) => number;

function swap(coordinates: number[], i: number, j: number) {
  let tmp = coordinates[i];
  coordinates[i] = coordinates[j];
  coordinates[j] = tmp;
  i++;
  j++;
  tmp = coordinates[i];
  coordinates[i] = coordinates[j];
  coordinates[j] = tmp;
}

function partition(
  coordinates: number[],
  low: number,
  high: number,
  comparator: Comparator,
): number {
  const pivotX = coordinates[high];
  const pivotY = coordinates[high + 1];
  let index = high;
  while (index > low) {
    const testY = coordinates[--index];
    const testX = coordinates[--index];
    if (comparator(testX, testY, pivotX, pivotY) > 0) {
      swap(coordinates, index, high - 2);
      swap(coordinates, high - 2, high);
      high -= 2;
    }
  }
  return high;
}

function quicksort(
  coordinates: number[],
  fromIndex: number,
  toIndex: number,
  comparator: Comparator,
) {
  if (fromIndex < toIndex) {
    const partitionIndex = partition(
      coordinates,
      fromIndex,
      toIndex,
      comparator,
    );
    quicksort(coordinates, fromIndex, partitionIndex - 2, comparator);
    quicksort(coordinates, partitionIndex + 2, toIndex, comparator);
  }
}

export function sortCoordinates(
  coordinates: number[],
  comparator?: Comparator,
) {
  comparator ||= comparePointsForSort;
  quicksort(coordinates, 0, coordinates.length - 2, comparator);
}

export function appendChanged(
  x: number,
  y: number,
  tolerance: Tolerance,
  coordinates: number[],
) {
  if (!coordinates.length) {
    coordinates.push(x, y);
    return;
  }
  const { length } = coordinates;
  if (
    !(
      tolerance.match(x, coordinates[length - 2]) &&
      tolerance.match(y, coordinates[length - 1])
    )
  ) {
    coordinates.push(x, y);
  }
}

export function coordinateMatch(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  tolerance: Tolerance,
) {
  return tolerance.match(ax, bx) && tolerance.match(ay, by);
}

export function coordinatesMatch(
  i: Coordinates,
  j: Coordinates,
  tolerance: Tolerance,
) {
  if (i.length !== j.length) {
    return false;
  }
  let n = i.length;
  while (--n) {
    if (!tolerance.match(i[n], j[n])) {
      return false;
    }
  }
  return true;
}

export function coordinateEqual(
  ax: number,
  ay: number,
  bx: number,
  by: number,
) {
  return ax === bx && ay === by;
}

export function coordinatesEqual(i: Coordinates, j: Coordinates) {
  if (i.length !== j.length) {
    return false;
  }
  let n = i.length;
  while (--n) {
    if (i[n] != j[n]) {
      return false;
    }
  }
  return true;
}

export type CoordinateConsumer = (x: number, y: number) => boolean | void;

export function forEachCoordinate(
  coordinates: Coordinates,
  consumer: CoordinateConsumer,
  fromIndexInclusive?: number,
  toIndexExclusive?: number,
) {
  const { length } = coordinates;
  fromIndexInclusive = fromIndexInclusive == null ? 0 : fromIndexInclusive << 1;
  toIndexExclusive = toIndexExclusive == null ? length : toIndexExclusive << 1;
  while (fromIndexInclusive < toIndexExclusive) {
    const index = fromIndexInclusive % length;
    const result = consumer(coordinates[index], coordinates[index + 1]);
    fromIndexInclusive += 2;
    if (result === false) {
      break;
    }
  }
  return fromIndexInclusive >> 1;
}

export function crossProduct(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
) {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}

export function isConvex(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
) {
  return crossProduct(ax, ay, bx, by, cx, cy) >= 0;
}

export function angle(ax: number, ay: number, bx: number, by: number) {
  let result = Math.atan2(by - ay, bx - ax) + Math.PI / 2;
  if (result < 0) {
    result += Math.PI * 2;
  }
  return result;
}

export function reverse(coordinates: Coordinates): number[] {
  const reversed = [];
  let i = coordinates.length;
  while (i) {
    const y = coordinates[--i];
    const x = coordinates[--i];
    reversed.push(x, y);
  }
  return reversed;
}

export function compareCoordinatesForSort(a: Coordinates, b: Coordinates) {
  const length = Math.min(a.length, b.length);
  let i = 0;
  while (i < length) {
    const compare = comparePointsForSort(a[i], a[i + 1], b[i++], b[i++]);
    if (compare) {
      return compare;
    }
  }
  return a.length - b.length;
}
