import { Relation } from "../Relation";
import { Tolerance } from "../Tolerance";
import { forEachCoordinate, forEachLineSegmentCoordinates, isNaNOrInfinite } from "../coordinate";
import { NumberFormatter } from "../formatter";
import { Transformer } from "../transformer/Transformer";
import { Geometry } from "./Geometry";
import { InvalidGeometryError } from "./InvalidGeometryError";
import { perpendicularDistance } from "./LineSegment";
import { MultiGeometry } from "./MultiGeometry";
import { Point } from "./Point";
import { Rectangle } from "./Rectangle";


export class LineString implements Geometry {
    readonly coordinates: ReadonlyArray<number>
    private bounds?: Rectangle
    private centroid?: Point

    constructor(coordinates: ReadonlyArray<number>) {
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
    getCentroid(): Point {
        let { centroid } = this
        if (!centroid) {
            this.centroid = centroid = getCentroid(this.coordinates)
        }
        return centroid
    }
    getBounds(): Rectangle {
        let { bounds } = this
        if (!bounds) {
            this.bounds = bounds = Rectangle.valueOf(this.coordinates)
        }
        return bounds
    }
    walkPath(pathWalker: PathWalker): void {
        const { coordinates } = this
        const { length } = coordinates
        pathWalker.moveTo(coordinates[0], coordinates[1])
        let index = 2
        while(index < length){
            pathWalker.lineTo(coordinates[index++], coordinates[index++])
        }
    }
    toWkt(numberFormatter?: NumberFormatter): string {
        const result = ["LINESTRING ("]
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
    toMultiGeometry(tolerance: Tolerance): MultiGeometry {
        if (this.getBounds().isCollapsible(tolerance)){
            return this.getCentroid().toMultiGeometry()
        }
        return MultiGeometry.unsafeValueOf(undefined, [this])
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
    relate(other: Geometry, tolerance: Tolerance): Relation {
        throw new Error("Method not implemented.");
    }
    union(other: Geometry, tolerance: Tolerance): Geometry {
        throw new Error("Method not implemented.");
    }
    intersection(other: Geometry, tolerance: Tolerance): Geometry | null {
        throw new Error("Method not implemented.");
    }
    less(other: Geometry, tolerance: Tolerance): Geometry | null {
        throw new Error("Method not implemented.");
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

