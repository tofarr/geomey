import { SpatialConsumer, SpatialIndex } from ".";
import { Rectangle } from "../geom";
import { DISJOINT } from "../Relation";
import { Tolerance } from "../Tolerance";

interface ZOrderIndexEntry<T> {
  rectangle: Rectangle;
  value: T;
  minZ?: bigint;
  maxZ?: bigint;
  minIndex?: number;
  maxIndex?: number;
}

export class ZOrderIndex<T> implements SpatialIndex<T> {
  readonly tolerance: Tolerance;
  private entries: ZOrderIndexEntry<T>[];
  private entriesByMax?: ZOrderIndexEntry<T>[];
  private minX?: number
  private minY?: number

  constructor(tolerance: Tolerance) {
    this.tolerance = tolerance;
    this.entries = [];
  }
  add(rectangle: Rectangle, value: T) {
    this.entries.push({ rectangle, value });
    this.entriesByMax = null;
  }
  remove(rectangle: Rectangle, matcher: (value: T) => boolean): boolean {
    const { entries } = this
    if(!entries.length){
      return
    }
    this.prepareIndex();
    const { tolerance, entriesByMax } = this
    const minZ = calculateZOrder(
      Math.max(rectangle.minX, this.minX) - this.minX,
      Math.max(rectangle.minY, this.minY) - this.minY,
      this.tolerance.tolerance
    );
    const { length } = entries
    const { maxX, maxY } = rectangle
    let index = firstIndexOf(minZ, entriesByMax)
    while (index < length) {
      const entry = entries[index++];
      const entryRectangle = entry.rectangle
      if (entryRectangle.minX > maxX && entryRectangle.minY > maxY){
        return
      }
      if (rectangle.relateRectangle(entry.rectangle, tolerance) == DISJOINT){
        continue
      }
      if (matcher(entry.value) === false) {
        entries.splice(index, 1)
        this.entriesByMax = null
        return true;
      }
      index++
    }
    return false
  }
  findIntersecting(rectangle: Rectangle, consumer: SpatialConsumer<T>) {
    const { entries } = this
    if(!entries.length){
      return
    }
    this.prepareIndex();
    const { tolerance, entriesByMax } = this
    const t = tolerance.tolerance
    const minZ = calculateZOrder(
      Math.max(rectangle.minX, this.minX) - this.minX,
      Math.max(rectangle.minY, this.minY) - this.minY,
      this.tolerance.tolerance
    );
    const { length } = entries
    const { maxX, maxY } = rectangle
    let index = firstIndexOf(minZ, entriesByMax)
    while (index < length) {
      const entry = entries[index++];
      const entryRectangle = entry.rectangle
      if (entryRectangle.minX > maxX && entryRectangle.minY > maxY){
        return
      }
      if (rectangle.relateRectangle(entryRectangle, tolerance) == DISJOINT){
        continue
      }
      if (consumer(entry.value, entry.rectangle) === false) {
        return;
      }
    }
  }
  findAll(consumer: SpatialConsumer<T>) {
    for (const entry of this.entries) {
      if (consumer(entry.value, entry.rectangle) === false) {
        return;
      }
    }
  }
  private prepareIndex() {
    let { entriesByMax } = this
    if(entriesByMax){
      return
    }
    const { entries, tolerance } = this
    const t = tolerance.tolerance
    let minX = Infinity
    let minY = Infinity
    for(const entry of entries){
      const { rectangle } = entry
      minX = Math.min(minX, rectangle.minX)
      minY = Math.min(minY, rectangle.minY)
    }
    minX -= t
    minY -= t
    this.minX = minX
    this.minY = minY

    entries.forEach((entry) => {
      const { rectangle } = entry
      entry.minZ = calculateZOrder(
        rectangle.minX - t - minX,
        rectangle.minY - t - minY,
        t,
      )
      entry.maxZ = calculateZOrder(
        rectangle.maxX + t - minX,
        rectangle.maxY + t - minY,
        t,
      )
    })

    entries.sort(compareMin)
    entries.forEach((entry, index) => {
      entry.minIndex = index
    })
    this.entriesByMax = entriesByMax = entries.slice()
    entriesByMax.sort(compareMax)
    entriesByMax.forEach((entry, index) => {
      entry.maxIndex = index
    })
  }
}

function compareMin<T>(a: ZOrderIndexEntry<T>, b: ZOrderIndexEntry<T>) {
  return compareBigInt(a.minZ, b.minZ) || compareBigInt(a.maxZ, b.maxZ);
}

function compareMax<T>(a: ZOrderIndexEntry<T>, b: ZOrderIndexEntry<T>) {
  return compareBigInt(a.maxZ, b.maxZ) || compareBigInt(a.minZ, b.minZ);
}

function compareBigInt(a: bigint, b: bigint): number {
  const result = a - b
  if (result < BigInt(0)) {
    return -1
  } else if (result > BigInt(0)) {
    return 1
  }
  return 0
}

export function binarySearch<T>(entries: ZOrderIndexEntry<T>[], compare: (entry: ZOrderIndexEntry<T>) => number): number {
  let min = 0;
  let max = entries.length - 1;
  let i = 0
  while (min < max) {
    const pivot = (min + max) >> 1;
    const entry = entries[pivot];
    const result = compare(entry)
    if (result < 0) {
      max = pivot - 1;
    } else if(result > 0) {
      min = pivot + 1;
    } else {
      return pivot
    }
    if(i++ >= 100){
      throw new Error("binarySearch:Runaway")
    }
  }
  return min  // not found - approximate location...
}

export function firstIndexOf<T>(z: bigint, entriesByMax: ZOrderIndexEntry<T>[]): number {
  let index = binarySearch(entriesByMax, (entry) => compareBigInt(z, entry.maxZ))
  while (index && compareBigInt(z, entriesByMax[index - 1].maxZ) >= 0) {
    index--
  }
  const result = entriesByMax[index].minIndex
  return result
}

export function calculateZOrder(
  x: number,
  y: number,
  tolerance: number,
): bigint {
  if (x < 0 || y < 0){
    throw new Error(`illegal_argument:${x}:${y}`)
  }
  x = Math.round(x / tolerance);
  y = Math.round(y / tolerance);
  let result = BigInt(0);
  let shift = BigInt(0);
  let i = 0
  while ((x && x != -1) || (y && y != -1)) {
    result |= BigInt((x & 1) | ((y & 1) << 1)) << shift;
    shift += BigInt(2);
    x >>= 1;
    y >>= 1;
    if(i++ >= 100){
      throw new Error("calculateZOrder:Runaway")
    }
  }
  return result;
}
