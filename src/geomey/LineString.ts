
import { start } from "repl";
import { comparePoints } from "../geomey2d/LineSegment";
import { Points } from "../geomey2d/Points";
import { LineSegment, LineSegmentBuilder, getPerpendicularDistance } from "./LineSegment";
import { Point, distanceSquared } from "./Point";
import { MultiPoint, toOrdinateIndex } from "./MultiPoint";


export class InvalidLineStringError extends Error {
    constructor(pointList: MultiPoint) {
        super(pointList.toString())
    }
}


export class LineString {
    readonly pointList: MultiPoint

    constructor(pointList: MultiPoint) {
        if(pointList.getNumPoints() < 2) {
            throw new InvalidLineStringError(pointList)
        }
        this.pointList = pointList
    }

    getBounds() {
        return this.pointList.getBounds()
    }

    getNumSegments(): number {
        return this.pointList.points.length / 2 - 1
    }

    copySegment(index: number, target: LineSegmentBuilder) {
        const { pointList } = this
        index *= 2
        target.ax = pointList[index++]
        target.ay = pointList[index++]
        target.bx = pointList[index++]
        target.by = pointList[index]
        return target
    }

    forEach(visitor: (ax: number, ay: number, bx: number, by: number, index: number) => void | boolean, fromIndexInclusive?: number, toIndexExclusive?: number): number | undefined {
        return forEachSegment(visitor, fromIndexInclusive, toIndexExclusive)
    }

    forEachLineSegment(visitor: (lineSegment: LineSegmentBuilder, index: number) => void | boolean, fromIndexInclusive?: number, toIndexExclusive?: number): number | undefined { {
        const lineSegment = { ax: undefined, ay: undefined, bx: undefined, by: undefined }
        return this.forEach((ax, ay, bx, by, index) => {
            lineSegment.ax = ax
            lineSegment.ay = ay
            lineSegment.bx = bx
            lineSegment.by = by
            return visitor(lineSegment, index)
        })
    }

    isValid(accuracy: number) {
        const accuracySquared = accuracy ** 2
        const invalidSegmentIndex = this.indexOfSegment((ax, ay, bx, by) => {
            return distanceSquared(ax, ay, bx, by) < accuracySquared
        })
        return invalidSegmentIndex == null
    }

    reversed() {
        return new LineString(this.pointList.reversed())
    }

    normalize() {
        const { points } = this.pointList
        if (comparePoints(points[0], points[1], points[points.length-2], points[points.length-1]) > 0) {
            return this.reversed()
        }
        return this
    }

    generalize(accuracy: number): LineString | LineSegment | Point {
        const bounds = this.getBounds()
        if (bounds.getWidth() <= accuracy && bounds.getHeight() <= accuracy) {
            return bounds.getCentroid()
        }
        const generalized = []
        douglasPeucker(this.pointList, 0, this.getNumSegments(), accuracy, generalized)
        const points = this.pointList.points
        generalized.push(points[points.length-2], points[points.length-1])
        if (generalized.length == points.length){
            return this  // No changes
        }
        if (generalized.length == 4) {
            return new LineSegment(generalized[0], generalized[1], generalized[2], generalized[3])
        }
        return new LineString(new MultiPoint(generalized))
    }
}


export function douglasPeucker(pointList: MultiPoint, startIndex: number, endIndex: number, accuracy: number, target: number[]) {
    if (endIndex - startIndex < 2) {
        pointList.eachPoint(target.push, startIndex, endIndex)
        return
    }
    let maxDist = 0
    let maxIndex = startIndex
    const { points } = pointList
    const ax = points[startIndex*2]
    const ay = points[startIndex*2+1]
    const bx = points[endIndex*2]
    const by = points[endIndex*2+1]
    pointList.eachPoint((x, y, index) => {
        const dist = getPerpendicularDistance(x, y, ax, ay, bx, by)
        if (dist > maxDist) {
            maxDist = dist
            maxIndex = index
        }
    })
    if (maxDist <= accuracy){
        target.push(ax, ay)
        return
    }
    douglasPeucker(pointList, startIndex, maxIndex, accuracy, target)
    douglasPeucker(pointList, maxIndex, endIndex, accuracy, target)
}


export function forEachSegment(points: ReadonlyArray<number>, visitor: (ax: number, ay: number, bx: number, by: number) => void, fromIndexInclusive?: number, toIndexExclusive?: number) {
    fromIndexInclusive = toOrdinateIndex(fromIndexInclusive || 0)
    toIndexExclusive = toIndexExclusive ? toOrdinateIndex(toIndexExclusive) : (points.length - 2)
    
    let ax = points[fromIndexInclusive++]
    let ay = points[fromIndexInclusive++]

    while(fromIndexInclusive < toIndexExclusive) {
        let bx = points[fromIndexInclusive++]
        let by = points[fromIndexInclusive++]
        visitor(ax, ay, bx, by)
        ax = bx
        ay = by
    }
}

export function indexOfSegment(points: ReadonlyArray<number>, checker: (ax: number, ay: number, bx: number, by: number) => boolean, fromIndexInclusive?: number, toIndexExclusive?: number): number | null {
    fromIndexInclusive = toOrdinateIndex(fromIndexInclusive || 0)
    toIndexExclusive = toIndexExclusive ? toOrdinateIndex(toIndexExclusive) : (points.length - 2)
    
    let ax = points[fromIndexInclusive++]
    let ay = points[fromIndexInclusive++]

    while(fromIndexInclusive < toIndexExclusive) {
        let bx = points[fromIndexInclusive++]
        let by = points[fromIndexInclusive++]
        if(checker(ax, ay, bx, by)) {
            return fromIndexInclusive / 2 - 1
        }
        ax = bx
        ay = by
    }
}
