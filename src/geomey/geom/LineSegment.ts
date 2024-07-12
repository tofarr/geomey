import { comparePointsForSort, isNaNOrInfinite } from "../coordinate"
import { NUMBER_FORMATTER, NumberFormatter } from "../path/NumberFormatter"
import { normalizeValue } from "../tolerance"
import { Transformer } from "../transformer/Transformer"
import { Geometry } from "./Geometry"
import { InvalidGeometryError } from "./InvalidGeometryError"
import { LineSegmentBuilder } from "./LineSegmentBuilder"
import { LineString } from "./LineString"
import { MultiGeometry } from "./MultiGeometry"
import { Point, pointsMatch } from "./Point"
import { PointBuilder, copyToPoint } from "./PointBuilder"
import { Rectangle } from "./Rectangle"
import { A_OUTSIDE_B, B_OUTSIDE_A, Relation, TOUCH, flipAB } from "./Relation"



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

    generalize(tolerance: number): Geometry {
        if(this.getDx() <= tolerance && this.getDy() <= tolerance){
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

    relatePoint(point: PointBuilder, tolerance: number): Relation {
        const { ax, ay, bx, by } = this
        const { x, y } = point
        const dist = getPerpendicularDistance(x, y, ax, ay, bx, by)
        if (dist > tolerance){
            return (A_OUTSIDE_B | B_OUTSIDE_A) as Relation
        }
        let result = TOUCH
        if (!pointsMatch(ax, ay, x, y, tolerance) || !pointsMatch(bx, by, x, y, tolerance)) {
            result |= A_OUTSIDE_B
        }
        return result
    }

    relate(other: Geometry, tolerance: number): Relation {
        // If the length of this line segment is less than tolerance, test as a point.
        if(((this.getDx() ** 2) + (this.getDy() ** 2)) < (tolerance ** 2)) {
            return flipAB(other.relatePoint(this.getCentroid(), tolerance))
        }

        const multiGeometry = other.toMultiGeometry() // Convert to multi geometry
        // Test against points for touch
        // Test against linestrings 
        // Test against polygons for comntainment 
        throw new Error("Method not implemented.");
    }

    union(other: Geometry, tolerance: number): Geometry {
        throw new Error("Method not implemented.");
    }

    intersectionLine(other: LineSegment, tolerance: number, segment: boolean = true): Point | null {
        return intersectionLine(this, other, segment, tolerance)
    }

    intersection(other: Geometry, tolerance: number): Geometry | null {
        throw new Error("Method not implemented.");
    }

    less(other: Geometry, tolerance: number): Geometry | null {
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


function getDenom(
    iax: number, iay: number, ibx: number, iby: number,
    jax: number, jay: number, jbx: number, jby: number,
): number {
    return (jby - jay) * (ibx - iax) - (jbx - jax) * (iby - iay);
}


export function intersectionLine(i: LineSegmentBuilder, j: LineSegmentBuilder, segment: boolean, tolerance: number): Point | null {
    let { ax: iax, ay: iay, bx: ibx, by: iby, } = i
    let { ax: jax, ay: jay, bx: jbx, by: jby, } = j

    const denom = getDenom(iax, iay, ibx, iby, jax, jay, jbx, jby)
    if (denom == 0.0) { // Lines are parallel.
        return null;
    }
    const ui = ((jbx - jax) * (iay - jay) - (jby - jay) * (iax - jax)) / denom; // projected distance along i and j
    const uj = ((ibx - iax) * (iay - jay) - (iby - iay) * (iax - jax)) / denom;
    if(segment && (ui < 0 || ui > 1 || uj < 0 || uj > 1)) {
        return null
    }
    let x, y;
    
    if (iax == ibx) {
        x = iax;
    } else if (jax == jbx) {
        x = jax;
    } else {
        x = (ui * (ibx - iax)) + iax;
    }
    if (iay == iby) {
        y = iay;
    } else if (jay == jby) {
        y = jay;
    } else {
        y = (ui * (iby - iay)) + iay;
    }

    return Point.valueOf(normalizeValue(x, tolerance), normalizeValue(y, tolerance))
}
