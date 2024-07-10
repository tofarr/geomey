import { Geometry, InvalidGeometryError, isNaNOrInfinite } from "./Geometry"
import { Point, PointBuilder, comparePointsForSort, distanceSquared } from "./Point"
import { Rectangle, RectangleBuilder } from "./Rectangle"
import { A_OUTSIDE_B, B_OUTSIDE_A, Relation, TOUCH } from "./Relation"


export class LineSegment implements Geometry {
    readonly ax: number
    readonly ay: number
    readonly bx: number
    readonly by: number
    bounds?: Rectangle

    constructor(ax: number, ay: number, bx: number, by: number) {
        this.ax = ax
        this.ay = ay
        this.bx = bx
        this.by = by
        if (isNaNOrInfinite(ax, ay, bx, by) || !comparePointsForSort(ax, ay, bx, by)) {
            throw new InvalidGeometryError(this)
        }
    }

    getSlope(): number {
        return slope(this.ax, this.ay, this.bx, this.by)
    }

    getBounds(): Rectangle {
        if (!this.bounds) {
            const builder = new RectangleBuilder()
            builder.union(this.ax, this.ay)
            builder.union(this.bx, this.by)
            this.bounds = builder.build()
        }
        return this.bounds
    }

    getArea(): number {
        return 0
    }

    getLengthSquared(): number {
        return distanceSquared(this.ax, this.ay, this.bx, this.by)
    }

    getLength(): number {
        return Math.sqrt(this.getLengthSquared())
    }

    normalize(): LineSegment {
        if (comparePointsForSort(this.ax, this.ay, this.bx, this.by) > 0) {
            return new LineSegment(this.bx, this.by, this.ax, this.ay)
        }
        return this
    }

    isValid(accuracy: number) {
        return this.getLengthSquared() <= accuracy ** 2
    }

    generalize(accuracy: number): LineSegment | Point {
        const bounds = this.getBounds()
        if (bounds.isCollapsible(accuracy)) {
            return bounds.getCentroid()
        }
        return this
    }

    transform(transformer: (point: PointBuilder) => void): LineSegment {
        const point = { x: this.ax, y: this.ay }
        transformer(point)
        const ax = point.x
        const ay = point.y
        point.x = this.bx
        point.y = this.by
        transformer(point)
        return new LineSegment(ax, ay, point.x, point.y)
    }

    relatePoint(point: Point | PointBuilder, accuracy: number): Relation {
        const dist = getPerpendicularDistance(point.x, point.y, this.ax, this.ay, this.bx, this.by)
        if (dist <= accuracy){
            return A_OUTSIDE_B | TOUCH
        }
        return A_OUTSIDE_B | B_OUTSIDE_A
    }

    relateRectangle(rectangle: Rectangle, accuracy: number): Relation {
        getPerpendicularDistance()
    }

    relate(other: Geometry, accuracy: number): Relation {

    }

    union(other: Geometry, accuracy: number): Geometry {

    }

    intersection(other: Geometry, accuracy: number): Geometry | null {

    }

    less(other: Geometry, accuracy: number): Geometry | null {

    }

    toSvgPath(numberFormat: (n: number) => string, target: string[]) {
        target.push(
            "M",
            numberFormat(this.ax),
            " ",
            numberFormat(this.ay),
            "L",
            numberFormat(this.bx),
            " ",
            numberFormat(this.by)
        )
    }

    toCanvasPath(context: any) {
        const { ax, ay, bx, by } = this
        context.moveTo(ax, ay)
        context.lineTo(bx, by)
    }

    toWkt(numberFormat: (n: number) => string): string {
        const ax = numberFormat(this.ax)
        const ay = numberFormat(this.ay)
        const bx = numberFormat(this.bx)
        const by = numberFormat(this.by)
        return `LINESTRING (${ax} ${ay}, ${bx} ${by})`
    }

    toGeoJson(): any {
        return {
            type: "LineString",
            coordinates: [
                [this.ax, this.ay],
                [this.bx, this.by]
            ]
        }
    }
}


export interface LineSegmentBuilder {
    ax: number
    ay: number
    bx: number
    by: number
}


export function slope(ax: number, ay: number, bx: number, by: number): number {
    const dy = by - ay
    const dx = bx - ax
    return dy / dx
}


export function getPerpendicularDistance(pointX: number, pointY: number, lineStartX: number, lineStartY: number, lineEndX: number, lineEndY: number): number {
    const area = Math.abs(0.5 * (lineStartX * lineEndY + lineEndX * pointY + pointX * lineStartY - lineEndX * lineStartY - pointX * lineEndY - lineStartX * pointY));
    const bottom = Math.hypot(lineStartX - lineEndX, lineStartY - lineEndY);
    const height = area / bottom * 2;
    return height;
}


export function getLineIntersection(
    aax: number,
    aay: number,
    abx: number,
    aby: number,
    bax: number,
    bay: number,
    bbx: number,
    bby: number
) {


    float s02_x, s02_y, s10_x, s10_y, s32_x, s32_y, s_numer, t_numer, denom, t;
    s10_x = p1_x - p0_x;
    s10_y = p1_y - p0_y;
    s32_x = p3_x - p2_x;
    s32_y = p3_y - p2_y;

    denom = s10_x * s32_y - s32_x * s10_y;
    if (denom == 0)
        return 0; // Collinear
    bool denomPositive = denom > 0;

    s02_x = p0_x - p2_x;
    s02_y = p0_y - p2_y;
    s_numer = s10_x * s02_y - s10_y * s02_x;
    if ((s_numer < 0) == denomPositive)
        return 0; // No collision

    t_numer = s32_x * s02_y - s32_y * s02_x;
    if ((t_numer < 0) == denomPositive)
        return 0; // No collision

    if (((s_numer > denom) == denomPositive) || ((t_numer > denom) == denomPositive))
        return 0; // No collision
    // Collision detected
    t = t_numer / denom;
    if (i_x != NULL)
        *i_x = p0_x + (t * s10_x);
    if (i_y != NULL)
        *i_y = p0_y + (t * s10_y);

    return 1;
}
