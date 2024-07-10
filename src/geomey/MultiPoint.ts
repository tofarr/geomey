import { Geometry, InvalidGeometryError, isNaNOrInfinite } from "./Geometry"
import { MultiGeometry } from "./MultiGeometry"
import { Point, PointBuilder, comparePointsForSort, match, matchPoints } from "./Point"
import { Rectangle, RectangleBuilder } from "./Rectangle"
import { A_OUTSIDE_B, B_OUTSIDE_A, Relation, TOUCH, flipAB } from "./Relation"


export class MultiPoint implements Geometry {
    /** 
     * Geometry class representing an array of points which may or may not be unique
     */
    points: readonly number[]
    bounds?: Rectangle
    normalized?: MultiPoint | boolean

    constructor(points: number[]) {
        this.points = points
        if (!points.length || points.length % 2 || points.find(n => isNaNOrInfinite(n))) {
            throw new InvalidGeometryError(this)
        }
    }

    getNumPoints(): number {
        return this.points.length / 2
    }

    getBounds(): Rectangle {
        let { bounds } = this
        if (!bounds) {
            const builder = new RectangleBuilder()
            this.forEach((x, y) => { builder.union(x, y) })
            bounds = this.bounds = builder.build()
        }
        return bounds
    }

    getArea(): number {
        return 0
    }

    copyPoint(index: number, target: PointBuilder) {
        const { points } = this
        index *= 2
        target.x = points[index++]
        target.y = points[index]
        return target
    }

    forEach(visitor: (x: number, y: number, index: number) => void | boolean, fromIndexInclusive?: number, toIndexExclusive?: number): number | undefined {
        const { points } = this
        let i = toOrdinateIndex(fromIndexInclusive || 0)
        toIndexExclusive = toIndexExclusive ? toOrdinateIndex(toIndexExclusive) : points.length
        while(i < toIndexExclusive) {
            const result = visitor(points[i++], points[i++], fromIndexInclusive)
            if (result) {
                return fromIndexInclusive
            }
            fromIndexInclusive++
        }
    }

    forEachPoint(visitor: (point: PointBuilder, index: number) => void | boolean, fromIndexInclusive?: number, toIndexExclusive?: number) {
        const point = { x: undefined, y: undefined }
        return this.forEach((x, y, index) => {
            point.x = x
            point.y = y
            return visitor(point, index)
        })
    }

    reverse() {
        const { points } = this
        const reversed = new Array(points.length)
        let i = points.length
        while(i) {
            const y = points[--i]
            const x = points[--i]
            reversed.push(x, y)
        }
        return new MultiPoint(reversed)
    }

    normalize(): MultiPoint {
        let { normalized } = this
        if (!normalized) {
            const points = this.points.slice()
            quicksort(points, 0, points.length - 1)
            normalized = this.normalized = new MultiPoint(points)
            normalized.normalized = true
        }
        if (normalized === true) {
            normalized = this
        }
        return normalized
    }

    isValid(accuracy: number): boolean {
        return true
    }

    generalize(accuracy: number): Point | MultiPoint {
        const bounds = this.getBounds()
        const { minX, minY, maxX, maxY } = bounds
        if (match(minX, maxX, accuracy) && match(minY, maxY, accuracy)) {
            return bounds.getCentroid()
        }
        const clusters = new Set<number>()
        const columns = Math.ceil((maxX - minX) / accuracy)
        this.forEach((x, y) => {
            x = Math.round(x / accuracy)
            y = Math.round(y / accuracy)
            const cell = x + (y * columns)
            clusters.add(cell)
        })
        const clusterArray = Array.from(clusters)
        clusterArray.sort()
        const clusteredPoints = []
        for(const cell of clusters) {
            const x = (cell % columns) * accuracy
            const y = cell * accuracy / columns
            clusteredPoints.push(x, y)
        }
        if (clusteredPoints.length == this.points.length) {
            return this
        }
        return new MultiPoint(clusteredPoints)
    }

    transform(transformer: (point: PointBuilder) => void): MultiPoint {
        const transformed = []
        this.forEachPoint((point) => {
            transformer(point)
            transformed.push(point.x, point.y)
        })
        return new MultiPoint(transformed)
    }

    relatePoint(point: Point | PointBuilder, accuracy: number): Relation {
        const bounds = this.getBounds()
        if (bounds.isCollapsible(accuracy)) {
            return bounds.getCentroid().relatePoint(point, accuracy)
        }
        const { x, y } = point
        let result = 0
        if (this.forEach((px, py) => {
            return matchPoints(x, y, px, py, accuracy)
        })) {
            result = TOUCH
        }
        if(this.forEach((px, py) => {
            return !matchPoints(x, y, px, py, accuracy)
        })) {
            result |= B_OUTSIDE_A
        }
        return result
    }

    relateRectangle(rectangle: Rectangle, accuracy: number): Relation {
        if (rectangle.isCollapsible(accuracy)) {
            return this.relatePoint(rectangle.getCentroid(), accuracy)
        }
        const { points } = this
        let result = 0
        this.forEachPoint((point) => {
            result |= rectangle.relatePoint(point, accuracy)
        })
        return flipAB(result)
    }

    relate(other: Geometry, accuracy: number): Relation {
        const otherBounds = other.getBounds()
        if (otherBounds.isCollapsible(accuracy)) {
            return this.relatePoint(otherBounds.getCentroid(), accuracy)
        }
        let result = 0;
        this.forEachPoint((point) => {
            result |= other.relatePoint(point, accuracy)
        })
        return flipAB(result)
    }

    union(other: Geometry, accuracy: number): MultiPoint | Point {
        const otherBounds = other.getBounds()
        const points = this.points.slice()
        if (otherBounds.isCollapsible(accuracy)) {
            const centroid = otherBounds.getCentroid()
            const relation = this.relatePoint(centroid, accuracy)
            if (relation & B_OUTSIDE_A) {
                points.push(centroid.x, centroid.y)
            } else {
                return this.generalize(accuracy)
            }
        } else if (other instanceof MultiPoint) {
            points.push.apply(points, other.points)
            const result = new MultiPoint(points)
            return result.generalize(accuracy)
        } else if (other instanceof Point) {
            points.push(other.x, other.y)
            const result = new MultiPoint(points)
            return result.generalize(accuracy)
        } else {
            other = other.toMultiGeometry()
            if (other.points) {
                points.push.apply(points, other.points.points)
            }
            const result = new MultiGeometry(
                new MultiPoint(points),
                other.lineStrings,
                other.polygons
            )
            return result
        }
        return new MultiPoint(points).generalize(accuracy)
    }

    intersection(other: Geometry, accuracy: number): MultiPoint | Point | null {
        const points = []
        this.forEachPoint((point) => {
            if (other.relatePoint(point, accuracy) != (A_OUTSIDE_B | B_OUTSIDE_A)) {
                points.push(point.x, point.y)
            }
        })
        if (points.length == 0) {
            return null
        }
        if (points.length == 2) {
            return new Point(points[0], points[1])
        }
        return new MultiPoint(points)
    }

    less(other: Geometry, accuracy: number): MultiPoint | Point | null {
        return this.intersection(other, accuracy)
    }

    toSvgPath(numberFormat: (n: number) => string, target: string[]): void {
        this.forEach((ax, ay) => {
            const x = numberFormat(ax)
            const y = numberFormat(ay)
            target.push("M", x, " ", y, "L", x, " ", y)
        })
    }

    toCanvasPath(context: any): void {
        this.forEach((x, y) => {
            context.moveTo(x, y)
            context.lineTo(x, y)
        })
    }

    toWkt(numberFormat: (n: number) => string): string {
        const wkt = ["MULTIPOINT ("]
        this.forEach((x, y) => {
            wkt.push(numberFormat(x), " ", numberFormat(y), ", ")
        })
        wkt.pop()
        wkt.push(")")
        return wkt.join("")
    }

    toGeoJson(): any {
        return {
            type: "MultiPoint",
            coordinates: this.points.slice()
        }
    }

    toMultiGeometry(): MultiGeometry {
        return new MultiGeometry(this)
    }
}


export function toOrdinateIndex(index: number) {
    return index * 2
}


function swap(arr: number[], i: number, j: number): void {
    [arr[i], arr[j]] = [arr[j], arr[i]];
}


function partition(arr: number[], low: number, high: number): number {
    const pivot = arr[high];
    let i = low - 1;

    for (let j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            swap(arr, i, j);
        }
    }
    swap(arr, i + 1, high);
    return i + 1;
}


function quicksort(arr: number[], low: number, high: number): void {
    if (low < high) {
        const pi = partition(arr, low, high);
        quicksort(arr, low, pi - 1);
        quicksort(arr, pi + 1, high);
    }
}

export function sortPoints(points: number[]) {
    quicksort(points, 0, points.length - 1)
}
