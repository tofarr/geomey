import { A_OUTSIDE_B, B_OUTSIDE_A, Relation, TOUCH, UNKNOWN } from "../Relation";
import { Tolerance } from "../Tolerance";
import { appendChanged, CoordinateConsumer, coordinateMatch, forEachCoordinate, forEachLineSegmentCoordinates, isNaNOrInfinite, LineSegmentCoordinatesConsumer, sortCoordinates } from "../coordinate";
import { NUMBER_FORMATTER, NumberFormatter } from "../formatter";
import { Transformer } from "../transformer/Transformer";
import { AbstractGeometry } from "./AbstractGeometry";
import { Geometry } from "./Geometry";
import { InvalidGeometryError } from "./InvalidGeometryError";
import { getLength, intersectionLineSegment, LineSegment, perpendicularDistance, pointTouchesLineSegment, relateLineSegments } from "./LineSegment";
import { Point } from "./Point";
import { Rectangle } from "./Rectangle";
import { relate } from "./op/relate";

/**
 * A line string describes a series of line segments which may or may not self intersect.
 */
export class LineString extends AbstractGeometry {
    readonly coordinates: ReadonlyArray<number>
    
    private constructor(coordinates: ReadonlyArray<number>) {
        super()
        this.coordinates = coordinates
    }
    static valueOf(coordinates: ReadonlyArray<number>): LineString {
        const lineString = new LineString(coordinates)
        if (isNaNOrInfinite(...coordinates) || coordinates.length < 4){
            throw new InvalidGeometryError(lineString)
        }
        forEachLineSegmentCoordinates(coordinates, (ax, ay, bx, by) => {
            if(ax == bx && ay == by){
                throw new InvalidGeometryError(lineString)
            }
        })
        return lineString
    }
    static unsafeValueOf(coordinates: ReadonlyArray<number>): LineString {
        return new LineString(coordinates)
    }
    forEachCoordinate(consumer: CoordinateConsumer): number {
        return forEachCoordinate(this.coordinates, consumer)
    }
    forEachLineSegmentCoordinates(consumer: LineSegmentCoordinatesConsumer) {
        forEachLineSegmentCoordinates(this.coordinates, consumer)
    }
    protected calculateCentroid(): Point {
        return getCentroid(this.coordinates)
    }
    protected calculateBounds(): Rectangle {
        return Rectangle.valueOf(this.coordinates)
    }
    getLength() {
        let length = 0
        forEachLineSegmentCoordinates(this.coordinates, (ax, ay, bx, by) => {
            length += getLength(ax, ay, bx, by)
        })
        return length
    }
    walkPath(pathWalker: PathWalker): void {
        walkPath(this.coordinates, pathWalker)
    }
    toWkt(numberFormatter: NumberFormatter = NUMBER_FORMATTER): string {
        const result = ["LINESTRING "]
        coordinatesToWkt(this.coordinates, numberFormatter, result)
        return result.join("")
    }
    toGeoJson() {
        const coordinates = []
        forEachCoordinate(this.coordinates, (x, y) => { coordinates.push(x, y) })
        return {
            type: "LineString",
            coordinates
        }
    }
    transform(transformer: Transformer): Geometry {
        return LineString.valueOf(transformer.transformAll(this.coordinates))
    }
    generalize(tolerance: Tolerance): Geometry {
        if (this.getBounds().isCollapsible(tolerance)){
            return this.getCentroid()
        }
        const { coordinates } = this
        const generalized = douglasPeucker(coordinates, tolerance.tolerance)
        if (generalized.length === coordinates.length) {
            return this
        }
        return new LineString(generalized)
    }
    relatePoint(x: number, y: number, tolerance: Tolerance): Relation {
        return relatePointToLineString(x, y, this.coordinates, tolerance)
    }
    relateGeometry(other: Geometry, tolerance: Tolerance): Relation {
        if (other instanceof LineSegment) {
            return relateLineStringToLineSegment(this.coordinates, other.ax, other.ay, other.bx, other.by, tolerance)
        } else if (other instanceof LineString) {
            return relateLineStringToLineString(this.coordinates, other.coordinates, tolerance)
        }
        return relate(this, other, tolerance)
    }
}


export type LineStringConsumer = (lineString: LineString) => boolean | void


export function getCentroid(coordinates: ReadonlyArray<number>) {
    let x = 0
    let y = 0;
    let { length, length: offset } = coordinates
    while(offset){
        y += coordinates[--offset]
        x += coordinates[--offset]
    }
    return Point.unsafeValueOf(x / length, y / length)
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
        const dist = Math.abs(perpendicularDistance(coordinates[index++], coordinates[index++], ax, ay, bx, by))
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


export function getCoordinatesWithSelfIntersections(coordinates: ReadonlyArray<number>, tolerance: Tolerance): number[] {
    let numberOfLineSegments = coordinates.length >> 1
    let startIndexInclusive = 2
    const newCoordinates = [coordinates[0], coordinates[1]]
    const intersections = []
    forEachLineSegmentCoordinates(coordinates, (iax, iay, ibx, iby) => {
        intersections.length = 0
        forEachLineSegmentCoordinates(coordinates, (jax, jay, jbx, jby) => {
            const intersection = intersectionLineSegment(
                iax, iay, ibx, iby,
                jax, jay, jbx, jby,
                tolerance
            )
            if (intersection) {
                intersections.push(intersection.x, intersection.y)
            }
        }, startIndexInclusive += 2, --numberOfLineSegments)
        if ((intersections.length || 0) > 2) {
            sortCoordinates(intersections, (px, py, qx, qy) => {
                const distP = (px - iax) ** 2 + (py - iay) ** 2
                const distQ = (qx - iax) ** 2 + (qy - iay) ** 2
                return distP - distQ
            })
            forEachCoordinate(intersections, (ix, iy) => {
                appendChanged(ix, iy, tolerance, newCoordinates)
            })
        }
        appendChanged(ibx, iby, tolerance, newCoordinates)
    })
    return newCoordinates
}


export function getCoordinatesWithIntersectionsAgainst(
    coordinates: ReadonlyArray<number>, 
    otherCoordinates: ReadonlyArray<number>, 
    tolerance: Tolerance,
    numLineSegments?: number,
    otherNumLineSegments?: number
): ReadonlyArray<number> {
    const newCoordinates = [coordinates[0], coordinates[1]]
    const intersections = []
    let hasIntersections = false
    forEachLineSegmentCoordinates(coordinates, (iax, iay, ibx, iby) => {
        intersections.length = 0
        forEachLineSegmentCoordinates(otherCoordinates, (jax, jay, jbx, jby) => {
            const intersection = intersectionLineSegment(
                iax, iay, ibx, iby,
                jax, jay, jbx, jby,
                tolerance
            )
            if (intersection) {
                intersections.push(intersection.x, intersection.y)
            }
        }, 0, otherNumLineSegments)
        if ((intersections.length || 0) > 2) {
            sortCoordinates(intersections, (px, py, qx, qy) => {
                const distP = (px - iax) ** 2 + (py - iay) ** 2
                const distQ = (qx - iax) ** 2 + (qy - iay) ** 2
                return distP - distQ
            })
        }
        hasIntersections ||= !!intersections.length
        forEachCoordinate(intersections, (ix, iy) => {
            appendChanged(ix, iy, tolerance, newCoordinates)
        })
        appendChanged(ibx, iby, tolerance, newCoordinates)
    }, 0, numLineSegments)
    return hasIntersections ? newCoordinates : coordinates
}


export function relatePointToLineString(x: number, y: number, coordinates: ReadonlyArray<number>, tolerance: Tolerance): Relation {
    let result = UNKNOWN
    forEachLineSegmentCoordinates(this.coordinates, (ax, ay, bx, by) => {
        if(pointTouchesLineSegment(x, y, ax, ay, bx, by, tolerance)){
            result |= TOUCH
        }
        if(!(coordinateMatch(ax, ay, x, y, tolerance) && coordinateMatch(bx, by, x, y, tolerance))){
            result |= A_OUTSIDE_B
        }
        return result !== (TOUCH | A_OUTSIDE_B)
    })
    return result
}


export function relateLineStringToLineSegment(
    coordinates: ReadonlyArray<number>,
    ax: number, ay: number, bx: number, by: number,
    tolerance: Tolerance
): Relation {
    let result = UNKNOWN
    forEachLineSegmentCoordinates(coordinates, (jax, jay, jbx, jby) => {
        result |= relateLineSegments(ax, ay, bx, by, jax, jay, jbx, jby, tolerance)
        return result !== (TOUCH | A_OUTSIDE_B | B_OUTSIDE_A)
    })
    return result
}


export function relateLineStringToLineString(
    coordinates: ReadonlyArray<number>,
    againstCoordinates: ReadonlyArray<number>, tolerance: Tolerance
): Relation {
    let result = UNKNOWN
    forEachLineSegmentCoordinates(coordinates, (iax, iay, ibx, iby) => {
        forEachLineSegmentCoordinates(againstCoordinates, (jax, jay, jbx, jby) => {
            result |= relateLineSegments(iax, iay, ibx, iby, jax, jay, jbx, jby, tolerance)
            return result !== (TOUCH | A_OUTSIDE_B | B_OUTSIDE_A)
        })
        return result !== (TOUCH | A_OUTSIDE_B | B_OUTSIDE_A)
    })
    return result
}


export function walkPath(coordinates: ReadonlyArray<number>, pathWalker: PathWalker){
    const { length } = coordinates
    pathWalker.moveTo(coordinates[0], coordinates[1])
    let index = 2
    while(index < length){
        pathWalker.lineTo(coordinates[index++], coordinates[index++])
    }
}

export function coordinatesToWkt(coordinates: ReadonlyArray<number>, numberFormatter: NumberFormatter, result: string[]) {
    result.push("(")
    forEachCoordinate(this.coordinates, (x, y) => {
        result.push(
            numberFormatter(x),
            " ",
            numberFormatter(y),
            ", "
        )
    })
    result.pop()
    result.push(")")
}
