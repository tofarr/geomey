import { CoordinateConsumer, crossProduct, forEachCoordinate, forEachLineSegmentCoordinates, forEachPointCoordinate, LineSegmentCoordinatesConsumer } from "../coordinate";
import { NumberFormatter } from "../formatter";
import { A_INSIDE_B, A_OUTSIDE_B, B_INSIDE_A, DISJOINT, Relation, TOUCH, UNKNOWN } from "../Relation";
import { Tolerance } from "../Tolerance";
import { Transformer } from "../transformer/Transformer";
import { AbstractGeometry } from "./AbstractGeometry";
import { Geometry } from "./Geometry";
import { LineSegment, pointTouchesLineSegment } from "./LineSegment";
import { douglasPeucker, getCoordinatesWithIntersectionsAgainst, LineString, walkPath } from "./LineString";
import { MultiGeometry } from "./MultiGeometry";
import { relate } from "./op/relate";
import { Point } from "./Point";
import { Polygon } from "./Polygon";
import { Rectangle } from "./Rectangle";


/**
 * A linear is a non self intersecting closed line string. The first coordinate is not
 * repeated at the end of the coordinate array. 
 */
export class LinearRing extends AbstractGeometry {
    readonly coordinates: ReadonlyArray<number>
    private polygon?: Polygon
    private convexRings: ReadonlyArray<LinearRing>

    private constructor(coordiantes: ReadonlyArray<number>) {
        super()
        this.coordinates = coordiantes
    }
    static valueOf(coordinates: ReadonlyArray<number>, tolerance: Tolerance): LinearRing[] {
        throw new Error("Method not implemented.");
    }
    static unsafeValueOf(coordinates: ReadonlyArray<number>): LinearRing {
        return new LinearRing(coordinates)
    }
    protected calculateCentroid(): Point {
        return calculateCentroid(this.coordinates)
    }
    protected calculateBounds(): Rectangle {
        return Rectangle.valueOf(this.coordinates)
    }
    walkPath(pathWalker: PathWalker): void {
        walkPath(this.coordinates, pathWalker)
        pathWalker.closePath()
    }
    toWkt(numberFormatter?: NumberFormatter): string {
        const result = ["POLYGON("]
        ringToWkt(this.coordinates, numberFormatter, false, result)
        result.push(")")
        return result.join("")
    }
    toGeoJson() {
        const coordinates = []
        forEachRingCoordinate(this.coordinates, (x, y) => { coordinates.push([x, y]) })
        return {
            type: "Polygon",
            coordinates
        }
    }
    isConvex(): boolean {
        return this.getConvexRings().length > 1
    }
    getConvexRings(): ReadonlyArray<LinearRing> {
        let { convexRings } = this
        if (!convexRings) {
            const convexRingsCoordinates = []
            splitToConvex(this.coordinates, convexRingsCoordinates)
            if (convexRingsCoordinates.length === 1) {
                convexRings = [this]
            } else {
                convexRings = convexRingsCoordinates.map((coordinates) => {
                    const convexRing = new LinearRing(coordinates)
                    convexRing.convexRings = [convexRing]
                    return convexRing
                })
            }
            this.convexRings = convexRings
        }
        return convexRings
    }
    getPolygon(): Polygon {
        let { polygon } = this
        if (!polygon) {
            this.polygon = polygon = Polygon.unsafeValueOf(this)
        }
        return polygon
    }
    transform(transformer: Transformer, tolerance: Tolerance): Geometry {
        const coordinates = transformer.transformAll(this.coordinates)
        const rings = LinearRing.valueOf(coordinates, tolerance)
        if (rings.length === 1){
            const [ring] = rings
            if (ring.getBounds().isCollapsible(tolerance)) {
                return ring.getCentroid()
            }
            return ring
        }
        return MultiGeometry.valueOf(null, null, rings)
        
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
        return new LinearRing(generalized)
    }
    relatePoint(x: number, y: number, tolerance: Tolerance): Relation {
        return relateRingToPoint(this.coordinates, x, y, tolerance)
    }
}

export function forEachRingCoordinate(
    shell: ReadonlyArray<number>,
    consumer: CoordinateConsumer, 
    reverse: boolean = false
): number {
    if(!reverse){
        return forEachCoordinate(shell, consumer, 0, shell.length >> 1 + 1)
    }
    if (consumer(shell[0], shell[1]) === false){
        return 0
    }
    let index = shell.length
    while (index) {
        const y = shell[--index]
        const x = shell[--index]
        const result = consumer(x, y)
        if (result === false) {
            return index
        }
    }
}

export function forEachRingLineSegmentCoordinates(
    shell: ReadonlyArray<number>,
    consumer: LineSegmentCoordinatesConsumer, 
    reverse: boolean = false
): boolean | void {
    if(!reverse){
        return forEachLineSegmentCoordinates(shell, consumer, 0, shell.length >> 1)
    }
    let bx = shell[0]
    let by = shell[1]
    let index = shell.length
    while (index) {
        const ay = shell[--index]
        const ax = shell[--index]
        const result = consumer(ax, ay, bx, by)
        if (result === false) {
            return result
        }
        bx = ax
        by = ay
    }
}


export function calculateCentroid(coordinates: ReadonlyArray<number>): Point {
    let xSum = 0
    let ySum = 0
    let area = 0
    forEachLineSegmentCoordinates(coordinates, (ax, ay, bx, by) => {
        const a = ax * by - bx * ay;
        area += a;
        xSum += (ax + bx) * a;
        ySum += (ay + by) * a;
    }, 0, coordinates.length >> 1)
    area *= 0.5;
    const cx = xSum / (6 * area);
    const cy = ySum / (6 * area);
    return Point.valueOf(cx, cy);
}


export function ringToWkt(coordinates: ReadonlyArray<number>, numberFormatter: NumberFormatter, reverse: boolean, result: string[]) {
    result.push("(")
    forEachRingCoordinate(this.coordinates, (x, y) => {
        result.push(
            numberFormatter(x),
            " ",
            numberFormatter(y),
            ", "
        )
    }, reverse)
    result.pop()
    result.push(")")
}

export function isPointInRing(x: number, y: number, coordinates: ReadonlyArray<number>): boolean {
    let inside = false;
    forEachRingLineSegmentCoordinates(coordinates, (ax, ay, bx, by) => {
        const intersect = ((ay > y) !== (by > y)) && (x < (bx - ax) * (y - ay) / (by - ay) + ax);
        if (intersect) {
            inside = !inside;
        }
    })
    return inside;
}

export function relateRingToPoint(coordinates: ReadonlyArray<number>, x: number, y: number, tolerance: Tolerance): Relation {
    let touch = false
    let inside = false;
    forEachRingLineSegmentCoordinates(coordinates, (ax, ay, bx, by) => {
        const intersect = ((ay > y) !== (by > y)) && (x < (bx - ax) * (y - ay) / (by - ay) + ax);
        if (intersect) {
            inside = !inside;
        }
        touch = pointTouchesLineSegment(x, y, ax, ay, bx, by, tolerance)
        return !touch
    })
    if (touch) {
        return (TOUCH | A_OUTSIDE_B) as Relation
    }
    return inside ? B_INSIDE_A : DISJOINT
}


export function forEachAngle(coordinates: ReadonlyArray<number>, consumer: (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) => boolean | void) {
    const { length } = coordinates
    let ax = coordinates[length-2]
    let ay = coordinates[length-1]
    let bx = coordinates[0]
    let by = coordinates[1]
    forEachCoordinate(coordinates, (cx, cy) => {
        if(consumer(ax, ay, bx, by, cx, cy) === false){
            return
        }
        ax = bx
        ay = by
        bx = cx
        by = by
    }, 1, length >> 1)
}


export function isConvex(coordinates: ReadonlyArray<number>): boolean {
    let result = true
    forEachAngle(coordinates, (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) => {
        result = crossProduct(ax, ay, bx, by, cx, cy) >= 0
        return result
    })
    return result
}


export function splitToConvex(coordinates: ReadonlyArray<number>, result: ReadonlyArray<number>[]) {
    const { length } = coordinates
    const splitStart = getSplitStart(coordinates)
    if (splitStart == null) {
        result.push(coordinates)
        return
    }
    let splitEnd = getSplitEnd(coordinates, splitStart)
    const a = coordinates.slice(0, splitStart.index + 2)
    const b = coordinates.slice(splitStart.index, splitEnd + 2)
    a.push.apply(coordinates.slice(splitEnd))
    splitToConvex(a, result)
    splitToConvex(b, result)
}


interface SplitStart{
    index: number
    ax: number
    ay: number
    bx: number
    by: number
}


function getSplitStart(coordinates: ReadonlyArray<number>): SplitStart {
    const { length } = coordinates
    let result = null
    let index = length - 2
    forEachAngle(coordinates, (ax, ay, bx, by, cx, cy) => {
        index += 2
        if (crossProduct(ax, ay, bx, by, cx, cy) < 0){
            index %= length
            result = { index, ax, ay, bx, by }
        }
        return result == null
    })
    return result
}


function getSplitEnd(coordinates: ReadonlyArray<number>, splitStart: SplitStart): number {
    // Get the point closest to b that is on the left side of the line
    const { ax, ay, bx, by } = splitStart
    let minDistSq = Infinity
    let minIndex = undefined
    let index = splitStart.index + 2
    forEachPointCoordinate(coordinates, (x, y) => {
        if (crossProduct(ax, ay, bx, by, x, y) >= 0){
            const distSq = (x - bx) ** 2 + (y - by) ** 2
            if (distSq < minDistSq){
                minDistSq = distSq
                minIndex = index
            }
            index += 2
        }
    }, index, coordinates.length - index)
    return minIndex
}
