import { ArrayLineSegmentCursor } from "../cursor/ArrayLineSegmentCursor";
import { CoordinateCursor } from "../coordinate/CoordinateCursor";
import { NUMBER_FORMATTER, NumberFormatter } from "../path/NumberFormatter";
import { Transformer } from "../transformer/Transformer";
import { AbstractMultiPoint } from "./AbstractMultiPoint";
import { Geometry } from "./Geometry";
import { MultiGeometry } from "./MultiGeometry";
import { MultiPoint } from "./MultiPoint";
import { Point } from "./Point";
import { PointBuilder } from "./PointBuilder";
import { Rectangle } from "./Rectangle";
import { Relation } from "./Relation";


export abstract class AbstractLineString extends AbstractMultiPoint {

    protected constructor(ordinates: ReadonlyArray<number>) {
        super(ordinates)
    }

    getLineSegmentCursor() {
        return new ArrayLineSegmentCursor(this.ordinates)
    }

    forEachSegment(visitor: (ax: number, ay: number, bx: number, by: number, index: number) => void | boolean, fromIndexInclusive?: number, toIndexExclusive?: number): number | undefined {
        const { ordinates } = this
        let i = (fromIndexInclusive || 0) * 2
        toIndexExclusive = toIndexExclusive ? (toIndexExclusive * 2) : ordinates.length
        while(i < toIndexExclusive) {
            const result = visitor(ordinates[i++], ordinates[i++], fromIndexInclusive)
            if (result) {
                return fromIndexInclusive
            }
            fromIndexInclusive++
        }
    }

    forEachLineSegment(visitor: (lineSegment: LineSegmentBuilder, index: number) => void | boolean, fromIndexInclusive?: number, toIndexExclusive?: number) {
        const point = { x: undefined, y: undefined }
        return this.forEach((x, y, index) => {
            point.x = x
            point.y = y
            return visitor(point, index)
        })
    }

    isSelfIntersecting() {
        throw new Error("Method not implemented.");
    }

    toWkt(numberFormatter: NumberFormatter = NUMBER_FORMATTER): string {
        const result = ["LINESTRING ("]
        this.forEach((x, y) => {
            result.push(
                numberFormatter(x),
                " ",
                numberFormatter(y),
                ", "
            )
        })
        result.pop()
        result.push(")")
        return result.join("")
    }

    toGeoJson(): any {
        const coordinates = []
        this.forEach((x, y) => { coordinates.push(x, y) })
        return {
            type: "LineString",
            coordinates
        }
    }

    abstract transform(transformer: Transformer): Geometry
    abstract calculateGeneralized(accuracy: number): Geometry
    abstract relatePoint(point: PointBuilder, accuracy: number): Relation
    abstract relate(other: Geometry, accuracy: number): Relation
    abstract union(other: Geometry, accuracy: number): Geometry
    abstract intersection(other: Geometry, accuracy: number): Geometry | null
    abstract less(other: Geometry, accuracy: number): Geometry | null
    abstract walkPath(pathWalker: PathWalker)
    abstract toMultiGeometry(): MultiGeometry
}

export function douglasPeucker(cursor: CoordinateCursor, point: PointBuilder, startIndex: number, endIndex: number, accuracy: number, target: number[]) {
    if (endIndex - startIndex < 2) {
        while(startIndex < endIndex){
            cursor.get(startIndex++, point)
            target.push(point.x, point.y)
        }
        return
    }
    let maxDist = 0
    let maxIndex = startIndex
    const { x: ax, y: ay } = cursor.get(startIndex, point)
    const { x: bx, y: by } = cursor.get(endIndex, point)
    need store rather than cursor - something with a get and put
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