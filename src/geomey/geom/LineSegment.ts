import { comparePointsForSort, isNaNOrInfinite } from "../ordinate"
import { NUMBER_FORMATTER, NumberFormatter } from "../path/NumberFormatter"
import { Transformer } from "../transformer/Transformer"
import { Geometry } from "./Geometry"
import { InvalidGeometryError } from "./InvalidGeometryError"
import { LineString } from "./LineString"
import { MultiGeometry } from "./MultiGeometry"
import { Point, isPointsTouching } from "./Point"
import { PointBuilder } from "./PointBuilder"
import { Rectangle } from "./Rectangle"
import { A_OUTSIDE_B, B_OUTSIDE_A, Relation, TOUCH } from "./Relation"



export class LineSegment implements Geometry {
    readonly ax: number
    readonly ay: number
    readonly bx: number
    readonly by: number

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
        return Point.unsafeValueOf((this.ax + this.ay) / 2, (this.bx + this.by) / 2)
    }

    getBounds(): Rectangle {
        return Rectangle.valueOf(this.ax, this.ay, this.bx, this.by)
    }

    getArea(): number {
        return 0
    }

    getDx() {
        return this.bx - this.ax
    }

    getDy() {
        return this.by - this.ay
    }

    normalize(){
        if (comparePointsForSort(this.ax, this.ay, this.bx, this.by) > 0) {
            return new LineSegment(this.bx, this.by, this.ax, this.ay)
        }
        return this
    }

    generalize(accuracy: number): Geometry {
        if(this.getDx() <= accuracy && this.getDy() <= accuracy){
            return this.getCentroid()
        }
        return this
    }

    transform(transformer: Transformer): Geometry {
        const point = { x: this.ax, y: this.ay }
        transformer(point)
        const ax = point.x
        const ay = point.y
        point.x = this.bx
        point.y = this.by
        transformer(point)
        return LineSegment.valueOf(ax, ay, point.x, point.y)
    }

    relatePoint(point: PointBuilder, accuracy: number): Relation {
        const { ax, ay, bx, by } = this
        const { x, y } = point
        const dist = getPerpendicularDistance(x, y, ax, ay, bx, by)
        if (dist > accuracy){
            return (A_OUTSIDE_B | B_OUTSIDE_A) as Relation
        }
        let result = TOUCH
        if (!isPointsTouching(ax, ay, x, y, accuracy) || !isPointsTouching(bx, by, x, y, accuracy)) {
            result |= A_OUTSIDE_B
        }
        return result
    }

    relate(other: Geometry, accuracy: number): Relation {
        throw new Error("Method not implemented.");
    }

    union(other: Geometry, accuracy: number): Geometry {
        throw new Error("Method not implemented.");
    }

    intersection(other: Geometry, accuracy: number): Geometry | null {
        throw new Error("Method not implemented.");
    }

    less(other: Geometry, accuracy: number): Geometry | null {
        throw new Error("Method not implemented.");
    }
    
    walkPath(pathWalker: PathWalker) {
        pathWalker.moveTo(this.ax, this.ay)
        pathWalker.lineTo(this.bx, this.by)
    }
    
    toWkt(f: NumberFormatter = NUMBER_FORMATTER): string {
        return `LINESTRING (${f(this.ax)} ${f(this.ay)}, ${f(this.bx)} ${f(this.by)})`
    }
    
    toGeoJson(): any {
        return {
            type: "LineString",
            coordinates: [
                [this.ax, this.ay],
                [this.bx, this.by],
            ]
        }
    }

    toMultiGeometry(): MultiGeometry {
        return MultiGeometry.unsafeValueOf(
            undefined,
            [LineString.unsafeValueOf([this.ax, this.ay, this.bx, this.by])]
        )
    }
}


export function getPerpendicularDistance(pointX: number, pointY: number, lineStartX: number, lineStartY: number, lineEndX: number, lineEndY: number): number {
    const area = Math.abs(0.5 * (lineStartX * lineEndY + lineEndX * pointY + pointX * lineStartY - lineEndX * lineStartY - pointX * lineEndY - lineStartX * pointY));
    const bottom = Math.hypot(lineStartX - lineEndX, lineStartY - lineEndY);
    const height = area / bottom * 2;
    return height;
}
