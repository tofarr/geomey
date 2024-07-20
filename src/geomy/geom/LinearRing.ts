import { forEachLineSegmentCoordinates, LineSegmentCoordinatesConsumer } from "../coordinate";
import { NumberFormatter } from "../formatter";
import { A_INSIDE_B, A_OUTSIDE_B, B_INSIDE_A, DISJOINT, Relation, TOUCH, UNKNOWN } from "../Relation";
import { Tolerance } from "../Tolerance";
import { Transformer } from "../transformer/Transformer";
import { AbstractGeometry } from "./AbstractGeometry";
import { Geometry } from "./Geometry";
import { LineSegment, pointTouchesLineSegment } from "./LineSegment";
import { douglasPeucker, getCoordinatesWithIntersectionsAgainst, LineString, walkPath } from "./LineString";
import { MultiGeometry } from "./MultiGeometry";
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
    protected calculateMultiGeometry(): MultiGeometry {
        return MultiGeometry.unsafeValueOf(undefined, undefined, [this.getPolygon()])
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
    protected relateGeometry(other: Geometry, tolerance: Tolerance): Relation {
        if (other instanceof Point) {
            return relateRingToPoint(this.coordinates, other.x, other.y, tolerance)
        }
        if (other instanceof LineSegment) {
            return relateRingToLineString(this.coordinates, [other.ax, other.ay, other.bx, other.by], tolerance)
        }
        if (other instanceof LineString) {
            return relateRingToLineString(this.coordinates, other.coordinates, tolerance)
        }
        if (other instanceof LinearRing) {
            return relateRingToRing(this.coordinates, other.coordinates, tolerance)
        }
        return this.toMultiGeometry(tolerance).relate(other, tolerance)
    }
    union(other: Geometry, tolerance: Tolerance): Geometry {
        throw new Error("Method not implemented.");
    }
    protected intersectionGeometry(other: Geometry, tolerance: Tolerance): Geometry {
        throw new Error("Method not implemented.");
    }
    protected lessGeometry(other: Geometry, tolerance: Tolerance): Geometry {
        throw new Error("Method not implemented.");
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

export function relateRingToLineString(ringCoordinates: ReadonlyArray<number>, lineStringCoordinates: ReadonlyArray<number>, tolerance: Tolerance) {
    const lineStringCoordinatesToTest = getCoordinatesWithIntersectionsAgainst(
        lineStringCoordinates, 
        ringCoordinates,
        tolerance, 
        lineStringCoordinates.length >> 1 - 1,
        ringCoordinates.length >> 1
    )
    if (lineStringCoordinatesToTest === lineStringCoordinates){
        return relateRingToPoint(ringCoordinates, lineStringCoordinates[0], lineStringCoordinates[1], tolerance)
    }
    let result = TOUCH
    forEachLineSegmentCoordinates(lineStringCoordinatesToTest, (ax, ay, bx, by) => {
        const mx = (ax + bx) / 2
        const my = (ay + by) / 2
        result |= relateRingToPoint(ringCoordinates, mx, my, tolerance)
        return result !== (TOUCH | A_OUTSIDE_B | A_INSIDE_B)
    })
    return result
}


export function relateRingToRing(i: ReadonlyArray<number>, j: ReadonlyArray<number>, tolerance: Tolerance) {
    const lineStringCoordinatesToTest = getCoordinatesWithIntersectionsAgainst(
        i, j, tolerance, i.length >> 1, j.length >> 1
    )
    if (lineStringCoordinatesToTest === i){
        return relateRingToPoint(i, j[0], j[1], tolerance)
    }
    let result = TOUCH
    forEachLineSegmentCoordinates(lineStringCoordinatesToTest, (ax, ay, bx, by) => {
        const mx = (ax + bx) / 2
        const my = (ay + by) / 2
        result |= relateRingToPoint(j, mx, my, tolerance)
        return result !== (TOUCH | A_OUTSIDE_B | A_INSIDE_B)
    })
    return result
}
