import { NUMBER_FORMATTER, NumberFormatter } from "../path/NumberFormatter";
import { Transformer } from "../transformer/Transformer";
import { AbstractMultiPoint } from "./AbstractMultiPoint";
import { Geometry } from "./Geometry";
import { MultiGeometry } from "./MultiGeometry";
import { PointBuilder } from "./PointBuilder";
import { Relation } from "./Relation";
import { LineSegmentBuilder, copyToLineSegment } from "./LineSegmentBuilder";
import { intersectionLine } from "./LineSegment";
import { appendChanged, sortCoordinates } from "../coordinate";
import { distSq } from "./Point";


export abstract class AbstractLineString extends AbstractMultiPoint {

    protected constructor(ordinates: ReadonlyArray<number>) {
        super(ordinates)
    }

    forEachSegmentCoordinates(consumer: (ax: number, ay: number, bx: number, by: number) => void | boolean, fromIndexInclusive?: number, toIndexExclusive?: number): number {
        const { coordinates } = this
        let index = (fromIndexInclusive || 0) * 2
        toIndexExclusive = toIndexExclusive ? (toIndexExclusive * 2) :(coordinates.length - 2)
        while(index < toIndexExclusive) {
            const result = consumer(coordinates[index], coordinates[index+1], coordinates[index+2], coordinates[index+3])
            if (result === false) {
                return index
            }
            fromIndexInclusive += 2
        }
        return index
    }

    forEachLineSegment(consumer: (lineSegment: LineSegmentBuilder, index: number) => void | boolean, fromIndexInclusive?: number, toIndexExclusive?: number) {
        const lineSegment = { ax: undefined, ay: undefined, bx: undefined, by: undefined}
        fromIndexInclusive ||= 0
        this.forEachSegmentCoordinates((ax, ay, bx, by) => {
            copyToLineSegment(ax, ay, bx, by, lineSegment)
            return consumer(lineSegment, fromIndexInclusive++)
        }, fromIndexInclusive, toIndexExclusive)
    }

    reverseCoordinates(): number[] {
        const { coordinates } = this
        const reversed = new Array(coordinates.length)
        let i = coordinates.length
        while(i) {
            const y = coordinates[--i]
            const x = coordinates[--i]
            reversed.push(x, y)
        }
        return reversed
    }

    isSelfIntersecting(tolerance: number) {
        let result = false
        this.forEachLineSegment((i, index) => {
            return this.forEachLineSegment((j) => {
                const intersection = intersectionLine(i, j, true, tolerance)
                result = !!intersection
                return !intersection
            })
        })
        return result
    }

    getCoordinatesWithSelfIntersection(tolerance: number){
        let coordinates = []
        let intersections = []
        this.forEachLineSegment((i, index) => {
            intersections.length = 0
            this.forEachLineSegment((j) => {
                const intersection = intersectionLine(i, j, true, tolerance)
                if (intersection) {
                    appendChanged(intersection.x, intersection.y, tolerance, intersections)
                }
            })
            const { length } = intersections
            if (length > 2) {
                const { ax: iax, ay: iay } = i
                sortCoordinates(intersections, (ax, ay, bx, by) => {
                    return distSq(iax, iay, ax, ay) - distSq(iax, iay, bx, by)
                })
            }
            index = 0
            
            while(index < length){
                appendChanged(intersections[index++], intersections[index++], tolerance, coordinates)
            }
        })
        return coordinates
    }

    toWkt(numberFormatter: NumberFormatter = NUMBER_FORMATTER): string {
        const result = ["LINESTRING ("]
        this.forEachCoordinate((x, y) => {
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
        this.forEachCoordinate((x, y) => { coordinates.push(x, y) })
        return {
            type: "LineString",
            coordinates
        }
    }

    abstract transform(transformer: Transformer): Geometry
    abstract calculateGeneralized(tolerance: number): Geometry
    abstract relatePoint(point: PointBuilder, tolerance: number): Relation
    abstract relate(other: Geometry, tolerance: number): Relation
    abstract union(other: Geometry, tolerance: number): Geometry
    abstract intersection(other: Geometry, tolerance: number): Geometry | null
    abstract less(other: Geometry, tolerance: number): Geometry | null
    abstract walkPath(pathWalker: PathWalker)
    abstract toMultiGeometry(): MultiGeometry
}


function partition(coordinates: ReadonlyArray<number>, startIndex: number, endIndex: number, tolerance: number, target: number[]) {
    const ax = coordinates[startIndex]
    const ay = coordinates[startIndex+1]
    if (endIndex - startIndex < 4) {
        target.push(ax, ay)
        return
    }
    let maxDist = 0
    let maxIndex = startIndex
    const bx = coordinates[endIndex]
    const by = coordinates[endIndex+1]
    let index = startIndex+2
    while(index < endIndex){
        const dist = Math.abs(getPerpendicularDistance(coordinates[index++], coordinates[index++], ax, ay, bx, by))
        if (dist > maxDist) {
            maxDist = dist
            maxIndex = index
        }
    }
    if (maxDist <= tolerance){
        target.push(ax, ay)
        return
    }
    partition(coordinates, startIndex, maxIndex, tolerance, target)
    partition(coordinates, maxIndex, endIndex, tolerance, target)
}


export function douglasPeucker(coordinates: ReadonlyArray<number>, tolerance: number): number[]{
    const target = []
    partition(coordinates, 0, coordinates.length - 2, tolerance, target)
    target.push(coordinates[coordinates.length-2], coordinates[coordinates.length-1])
    return target
}
