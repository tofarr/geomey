import { SpatialConsumer, SpatialIndex } from ".";
import { Point, Rectangle } from "../geom";
import { Tolerance } from "../Tolerance";

export interface ZOrderIndexEntry<T> {
  rectangle: Rectangle;
  value: T;
  minZ?: bigint;
  maxZ?: bigint;
  minIndex?: number;
  maxIndex?: number;
}

export class ZOrderIndex<T> implements SpatialIndex<T> {
  readonly tolerance: Tolerance;
  readonly origin?: Point;
  private entries: ZOrderIndexEntry<T>[];
  private entriesByMax?: ZOrderIndexEntry<T>[];
  private calculatedOrigin?: Point;

  constructor(tolerance: Tolerance, origin?: Point) {
    this.tolerance = tolerance;
    this.entries = [];
    this.origin = origin;
  }
  add(rectangle: Rectangle, value: T) {
    this.entries.push({ rectangle, value });
    this.entriesByMax = null;
  }
  private forEachEntry(
    rectangle: Rectangle,
    consumer: (entry: ZOrderIndexEntry<T>) => boolean,
  ): boolean {
    const { entries } = this;
    if (!entries.length) {
      return true;
    }
    this.prepareIndex();
    const { entriesByMax, calculatedOrigin } = this;
    const minZ = calculateZOrder(
      Math.max(rectangle.minX, calculatedOrigin.x),
      Math.max(rectangle.minY, calculatedOrigin.y),
      calculatedOrigin,
      this.tolerance.tolerance,
    );
    const { length } = entries;
    const { maxX, maxY } = rectangle;
    let index = firstIndexOf(minZ, entriesByMax);
    while (index < length) {
      const entry = entries[index++];
      const entryRectangle = entry.rectangle;
      if (entryRectangle.minX > maxX && entryRectangle.minY > maxY) {
        return true;
      }
      if (!rectangle.intersectsRectangle(entryRectangle)) {
        continue;
      }
      if (consumer(entry) === false) {
        return false;
      }
    }
  }
  remove(rectangle: Rectangle, matcher: (value: T) => boolean): boolean {
    let found = false;
    this.forEachEntry(rectangle, (entry) => {
      if (matcher(entry.value)) {
        this.entries.splice(entry.minIndex, 1);
        this.entriesByMax = null;
        found = true;
      }
      return !found;
    });
    return found;
  }
  findIntersecting(
    rectangle: Rectangle,
    consumer: SpatialConsumer<T>,
  ): boolean {
    return this.forEachEntry(rectangle, (entry) => {
      if (consumer(entry.value, entry.rectangle) === false) {
        return false;
      }
      return true;
    });
  }
  findAll(consumer: SpatialConsumer<T>): boolean {
    for (const entry of this.entries) {
      if (consumer(entry.value, entry.rectangle) === false) {
        return false;
      }
    }
    return true;
  }
  private prepareIndex() {
    let { entriesByMax } = this;
    if (entriesByMax) {
      return;
    }
    const { entries, tolerance } = this;
    const t = tolerance.tolerance;

    let origin = this.origin;
    let minX = Infinity;
    let minY = Infinity;
    if (!origin) {
      for (const entry of entries) {
        const { rectangle } = entry;
        minX = Math.min(minX, rectangle.minX);
        minY = Math.min(minY, rectangle.minY);
      }
      minX -= t;
      minY -= t;
      origin = Point.valueOf(minX, minY);
    }
    this.calculatedOrigin = origin;

    entries.forEach((entry) => {
      const { rectangle } = entry;
      entry.minZ = calculateZOrder(
        rectangle.minX - t,
        rectangle.minY - t,
        origin,
        t,
      );
      entry.maxZ = calculateZOrder(
        rectangle.maxX + t,
        rectangle.maxY + t,
        origin,
        t,
      );
    });

    entries.sort(compareMin);
    entries.forEach((entry, index) => {
      entry.minIndex = index;
    });
    this.entriesByMax = entriesByMax = entries.slice();
    entriesByMax.sort(compareMax);
    entriesByMax.forEach((entry, index) => {
      entry.maxIndex = index;
    });
  }
}

function compareMin<T>(a: ZOrderIndexEntry<T>, b: ZOrderIndexEntry<T>) {
  return compareBigInt(a.minZ, b.minZ) || compareBigInt(a.maxZ, b.maxZ);
}

function compareMax<T>(a: ZOrderIndexEntry<T>, b: ZOrderIndexEntry<T>) {
  return compareBigInt(a.maxZ, b.maxZ) || compareBigInt(a.minZ, b.minZ);
}

function compareBigInt(a: bigint, b: bigint): number {
  const result = a - b;
  if (result < BigInt(0)) {
    return -1;
  } else if (result > BigInt(0)) {
    return 1;
  }
  return 0;
}

export function binarySearch<T>(
  entries: ZOrderIndexEntry<T>[],
  compare: (entry: ZOrderIndexEntry<T>) => number,
): number {
  let min = 0;
  let max = entries.length - 1;
  while (min < max) {
    const pivot = (min + max) >> 1;
    const entry = entries[pivot];
    const result = compare(entry);
    if (result < 0) {
      max = pivot - 1;
    } else if (result > 0) {
      min = pivot + 1;
    } else {
      return pivot;
    }
  }
  return min; // not found - approximate location...
}

export function firstIndexOf<T>(
  z: bigint,
  entriesByMax: ZOrderIndexEntry<T>[],
): number {
  let index = binarySearch(entriesByMax, (entry) =>
    compareBigInt(z, entry.maxZ),
  );
  while (index && compareBigInt(z, entriesByMax[index].maxZ) <= 0) {
    index--;
  }
  const result = entriesByMax[index].minIndex;
  return result;
}

export function calculateZOrder(
  x: number,
  y: number,
  origin: Point,
  tolerance: number,
): bigint {
  x -= origin.x;
  y -= origin.y;
  if (x < 0 || y < 0) {
    throw new Error(`illegal_argument:${x}:${y}`);
  }
  x = Math.round(x / tolerance);
  y = Math.round(y / tolerance);
  let result = BigInt(0);
  let shift = BigInt(0);
  while ((x && x != -1) || (y && y != -1)) {
    result |= BigInt((x & 1) | ((y & 1) << 1)) << shift;
    shift += BigInt(2);
    x >>= 1;
    y >>= 1;
  }
  return result;
}
