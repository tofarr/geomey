import { Relation } from "../Relation";
import { Tolerance } from "../Tolerance";
import { comparePointsForSort, isNaNOrInfinite } from "../coordinate";
import { NUMBER_FORMATTER, NumberFormatter } from "../formatter";
import { Transformer } from "../transformer/Transformer";
import { Geometry } from "./Geometry";
import { InvalidGeometryError } from "./InvalidGeometryError";
import { LineString } from "./LineString";
import { MultiGeometry } from "./MultiGeometry";
import { Point } from "./Point";
import { Rectangle } from "./Rectangle";


export class LineSegment implements Geometry {
    readonly ax: number
    readonly ay: number
    readonly bx: number
    readonly by: number
    private centroid?: Point
    private bounds?: Rectangle
    private multiGeometry?: MultiGeometry

    constructor(ax: number, ay: number, bx: number, by: number) {
        this.ax = ax
        this.ay = ay
        this.bx = bx
        this.by = by
    }
    static valueOf(ax: number, ay: number, bx: number, by: number): LineSegment {
        const result = new LineSegment(ax, ay, bx, by)
        if (isNaNOrInfinite(ax, ay, bx, by) || !comparePointsForSort(ax, ay, bx, by)) {
            throw new InvalidGeometryError(result)
        }
        return result
    }
    static unsafeValueOf(ax: number, ay: number, bx: number, by: number): LineSegment {
        return new LineSegment(ax, ay, bx, by)
    }
    getCentroid(): Point {
        let { centroid } = this
        if (!centroid){
            centroid = this.centroid = Point.unsafeValueOf(
                (this.ax + this.bx) / 2, 
                (this.ay + this.by , 2)
            )
        }
        return centroid
    }
    getBounds(): Rectangle {
        let { bounds } = this
        if (!bounds) {
            bounds = this.bounds = Rectangle.valueOf([this.ax, this.ay, this.bx, this.by])
        }
        return bounds
    }
    getDx() {
        return this.bx - this.ax
    }
    getDy() {
        return this.by - this.ay
    }
    getSlope() {
        return this.getDy() / this.getDx()
    }
    walkPath(pathWalker: PathWalker): void {
        pathWalker.moveTo(this.ax, this.ay)
        pathWalker.lineTo(this.bx, this.by)
    }
    toWkt(f: NumberFormatter = NUMBER_FORMATTER): string {
        return `LINESTRING (${f(this.ax)} ${f(this.ay)}, ${f(this.bx)} ${f(this.by)})`
    }
    toGeoJson() {
        return {
            type: "LineString",
            coordinates: [
                [this.ax, this.ay],
                [this.bx, this.by],
            ]
        }
    }
    toMultiGeometry(tolerance: Tolerance): MultiGeometry {
        if (this.getBounds().isCollapsible(tolerance)) {
            return this.getCentroid().toMultiGeometry()
        }
        return this.getMultiGeometry()
    }
    getMultiGeometry(): MultiGeometry {
        let { multiGeometry } = this
        if (!multiGeometry) {
            const lineString = LineString.unsafeValueOf([this.ax, this.ay, this.bx, this.by])
            this.multiGeometry = multiGeometry = MultiGeometry.unsafeValueOf(undefined, [lineString])
        }
        return multiGeometry
    }
    transform(transformer: Transformer): LineSegment | Point {
        const [ax, ay, bx, by] = transformer.transformAll([this.ax, this.ay, this.bx, this.by])
        if (ax == bx && ay == by){
            return Point.valueOf(ax, ay)
        }
        return LineSegment.valueOf(ax, ay, bx, by)
    }
    generalize(tolerance: Tolerance): LineSegment | Point {
        if (this.getBounds().isCollapsible(tolerance)){
            return this.getCentroid()
        }
        return this
    }
    relate(other: Geometry, tolerance: Tolerance): Relation {
        return this.getMultiGeometry().relate(other, tolerance)
    }
    union(other: Geometry, tolerance: Tolerance): Geometry {
        return this.getMultiGeometry().union(other, tolerance)
    }
    intersection(other: Geometry, tolerance: Tolerance): Geometry | null {
        return this.getMultiGeometry().intersection(other, tolerance)
    }
    less(other: Geometry, tolerance: Tolerance): Geometry | null {
        return this.getMultiGeometry().less(other, tolerance)
    }
}


export type LineSegmentConsumer = (lineSegment: LineSegment) => boolean | void


export function signedPerpendicularDistance(x: number, y: number, ax: number, ay: number, bx: number, by: number): number {
    const numerator = Math.abs((by - ay) * x - (bx - ax) * y + bx * ay - by * ax);
    const denominator = Math.sqrt((by - ay) ** 2 + (bx - ax) ** 2);
    return numerator / denominator;
}


export function perpendicularDistance(x: number, y: number, ax: number, ay: number, bx: number, by: number): number {
    return Math.abs(signedPerpendicularDistance(x, y, ax, ay, bx, by))
}
