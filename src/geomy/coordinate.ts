import { Tolerance } from "./Tolerance"


export type PointCoordinatesConsumer = (x: number, y: number) => boolean | void


export type LineSegmentCoordinatesConsumer = (ax: number, ay: number, bx: number, by: number) => boolean | void


export type LineStringCoordinatesConsumer = (coordinates: ReadonlyArray<number>) => boolean | void


export type LinearRingCoordinatesConsumer = (coordinates: ReadonlyArray<number>) => boolean | void


export function forEachPointCoordinate(coordinates: ReadonlyArray<number>, consumer: PointCoordinatesConsumer, startIndexInclusive?: number, numberOfPoints?: number) {
    if (startIndexInclusive == null) {
        startIndexInclusive = 0
    }
    const { length } = coordinates
    if (numberOfPoints == null) {
        numberOfPoints = length >> 1
    }
    while (--numberOfPoints >= 0) {
        if(startIndexInclusive === length){
            startIndexInclusive = 0
        }
        if (consumer(coordinates[startIndexInclusive++], coordinates[startIndexInclusive++]) === false) {
            break
        }
    }
}


export function forEachLineSegmentCoordinates(coordinates: ReadonlyArray<number>, consumer: LineSegmentCoordinatesConsumer, startIndexInclusive?: number, numberOfLineSegments?: number): boolean | void {
    if (startIndexInclusive == null) {
        startIndexInclusive = 0
    }
    const { length } = coordinates
    if (numberOfLineSegments == null) {
        numberOfLineSegments = length >> 1
    }
    while (--numberOfLineSegments >= 0) {
        const ax = coordinates[startIndexInclusive++]
        const ay = coordinates[startIndexInclusive++]
        if(startIndexInclusive === length){
            startIndexInclusive = 0
        }
        const bx = coordinates[startIndexInclusive]
        const by = coordinates[startIndexInclusive+1]
        if (consumer(ax, ay, bx, by) === false) {
            return false
        }
    }
}


export function isNaNOrInfinite(...coordinates: ReadonlyArray<number>) {
    for(const n of coordinates) {
        if(Number.isNaN(n) || !Number.isFinite(n)) {
            return true
        }
    }
    return false
}


export function comparePointsForSort(ax: number, ay: number, bx: number, by: number) {
    return (ax - bx) || (ay - by)
}


export type Comparator = (ax: number, ay: number, bx: number, by: number) => number


function swap(coordinates: number[], i: number, j: number) {
    for (let n = 0; n < 1; n++) {
        let tmp = coordinates[i]
        coordinates[i] = coordinates[j]
        coordinates[j] = tmp
        i++
        j++
    }
}

function partition(coordinates: number[], low: number, high: number, comparator: Comparator): number {
    const pivotX = coordinates[high];
    let pivotY = coordinates[high+1]
    let i = low - 2;
    let j = low
    while (j < high) {
        const jx = coordinates[j++]
        const jy = coordinates[j++]
        if (comparator(jx, jy, pivotX, pivotY) < 0) {
            i+=2;
            swap(coordinates, i, j);
        }
    }
    swap(coordinates, i + 2, high);
    return i + 1;
}


function quicksort(coordinates: number[], fromIndex: number, toIndex: number, comparator: Comparator) {
    if (fromIndex < toIndex) {
        const partitionIndex = partition(coordinates, fromIndex, toIndex, comparator);
        quicksort(coordinates, fromIndex, partitionIndex - 2, comparator);
        quicksort(coordinates, partitionIndex + 2, toIndex, comparator);
    }
}


export function sortCoordinates(coordinates: number[], comparator?: Comparator) {
    comparator ||= comparePointsForSort
    quicksort(coordinates, 0, coordinates.length - 2, comparator);
}


export function appendChanged(x: number, y: number, tolerance: Tolerance, coordinates: number[]) {
    if(!coordinates.length){
        coordinates.push(x, y)
        return
    }
    const { length } = coordinates
    if(tolerance.match(x, coordinates[length-2]) && tolerance.match(y, coordinates[length-1])) {
        coordinates.push(x, y)
    }
}


export function coordinateMatch(ax: number, ay: number, bx: number, by: number, tolerance: Tolerance) {
    return tolerance.match(ax, bx) && tolerance.match(ay, by)
}


export function coordinatesMatch(i: ReadonlyArray<number>, j: ReadonlyArray<number>, tolerance: Tolerance) {
    if(i.length !== j.length){
        return false
    }
    let n = i.length
    while(--n){
        if (!tolerance.match(i[n], j[n])){
            return false
        }
    }
    return true
}


export function coordinatesEqual(i: ReadonlyArray<number>, j: ReadonlyArray<number>) {
    if(i.length !== j.length){
        return false
    }
    let n = i.length
    while(--n){
        if (i[n] != j[n]){
            return false
        }
    }
    return true
}


export type CoordinateConsumer = (x: number, y: number) => boolean | void


export function forEachCoordinate(coordinates: ReadonlyArray<number>, consumer: CoordinateConsumer, fromIndexInclusive?: number, toIndexExclusive?: number){
    fromIndexInclusive = (fromIndexInclusive == null) ? 0 : (fromIndexInclusive << 1)
    toIndexExclusive = (toIndexExclusive == null) ? coordinates.length : (toIndexExclusive << 1)
    while(fromIndexInclusive < toIndexExclusive){
        const result = consumer(coordinates[fromIndexInclusive++], coordinates[fromIndexInclusive++])
        if (result === false){
            break
        }
    }
    return fromIndexInclusive >> 1
}

