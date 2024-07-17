import { comparePointsForSort, coordinateMatch, isNaNOrInfinite } from "../coordinate"
import { NUMBER_FORMATTER, NumberFormatter } from "../path/NumberFormatter"
import { Transformer } from "../transformer/Transformer"
import { Geometry } from "./Geometry"
import { InvalidGeometryError } from "./InvalidGeometryError"
import { LineSegmentBuilder } from "./LineSegmentBuilder"
import { LineString } from "./LineString"
import { MultiGeometry } from "./MultiGeometry"
import { Point } from "./Point"
import { PointBuilder } from "./PointBuilder"
import { Rectangle } from "./Rectangle"
import { A_OUTSIDE_B, DISJOINT, Relation, TOUCH, flipAB } from "./Relation"


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

    getSlope() {
        return this.getDy() / this.getDx()
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
        return relateLineSegmentToPoint(this, point.x, point.y, tolerance)
    }

    relateLineSegment(other: LineSegmentBuilder, tolerance: number): Relation {
        const { ax: iax, ay: iay, bx: ibx, by: iby } = this
        const { ax: jax, ay: jay, bx: jbx, by: jby } = other
        
        const intersection = intersectionLine(this, other, true, tolerance);
        if (!intersection){
            return DISJOINT
        }
        const result = (
            TOUCH | 
            this.relatePoint({x: jax, y: jay}, tolerance) |
            this.relatePoint({x: jbx, y: jby}, tolerance) |
            flipAB(relateLineSegmentToPoint(other, iax, iay, tolerance)) |
            flipAB(relateLineSegmentToPoint(other, ibx, iby, tolerance))
        ) as Relation
        return result
    }

    relate(other: Geometry, tolerance: number): Relation {
        // If the length of this line segment is less than tolerance, test as a point.
        if(((this.getDx() ** 2) + (this.getDy() ** 2)) < (tolerance ** 2)) {
            return flipAB(other.relatePoint(this.getCentroid(), tolerance))
        }
        if(other instanceof LineSegment){
            return this.relateLineSegment(other, tolerance)
        }
        return flipAB(other.relateLineSegment(this, tolerance))
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
        // Get points of intersection
        // Test mindpoints and other
        GET POINTS OF INTERSECTION
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


export function signedPerpendicularDistance(x: number, y: number, ax: number, ay: number, bx: number, by: number): number {
    const numerator = Math.abs((by - ay) * x - (bx - ax) * y + bx * ay - by * ax);
    const denominator = Math.sqrt((by - ay) ** 2 + (bx - ax) ** 2);
    return numerator / denominator;
}


export function perpendicularDistance(x: number, y: number, ax: number, ay: number, bx: number, by: number): number {
    return Math.abs(signedPerpendicularDistance(x, y, ax, ay, bx, by))
}


export function projectProgress(x: number, y: number, ax: number, ay: number, abx: number, aby: number): number {
   // Calculate the vector from A to the point
   const apx = x - ax;
   const apy = y - ay;

   // Calculate the projection of ap onto ab
   const abab = abx * abx + aby * aby;
   const apab = apx * abx + apy * aby;
   const progress = apab / abab;
   return progress
}


export function projectPointOntoLine(x: number, y: number, ax: number, ay: number, bx: number, by: number, target: PointBuilder): number {
   // Calculate the vector from A to B
   const abx = bx - ax;
   const aby = by - ay;

   const progress = projectProgress(x, y, ax, ay, abx, aby)
   
   target.x = ax + progress * abx
   target.y = ax + progress * aby

   return progress
}


export function projectPointOntoLineSegment(x: number, y: number, ax: number, ay: number, bx: number, by: number, tolerance: number, target: PointBuilder): boolean {
    // Calculate the vector from A to B
    const abx = bx - ax;
    const aby = by - ay;

    const progress = projectProgress(x, y, ax, ay, abx, aby)

    // Get projected point
    let px = ax + progress * abx
    let py = ax + progress * aby

    if(coordinateMatch(px, py, ax, ay, tolerance)){
        // if projected point is very close to a, use a
        px = ax
        py = ay
    } else if(coordinateMatch(px, py, bx, by, tolerance)) {
        // if projected point is very close to b, use b
        px = bx
        py = by
    } else if(progress < 0 || progress > 1){
        // reject points outside bounds
        return false
    }
    
    target.x = px
    target.y = py
    return true
}


export function intersectionLine(i: LineSegmentBuilder, j: LineSegmentBuilder, segment: boolean, tolerance: number): Point | null {
    let { ax: iax, ay: iay, bx: ibx, by: iby, } = i
    let { ax: jax, ay: jay, bx: jbx, by: jby, } = j

    const denom = (jby - jay) * (ibx - iax) - (jbx - jax) * (iby - iay);
    if (denom == 0.0) { 
        return null; // Lines are parallel.
    }

    // projected distance along i and j
    const ui = ((jbx - jax) * (iay - jay) - (jby - jay) * (iax - jax)) / denom; 
    const uj = ((ibx - iax) * (iay - jay) - (iby - iay) * (iax - jax)) / denom;
    
    // point of intersection
    const x = (ui * (ibx - iax)) + iax;
    const y = (ui * (ibx - iax)) + iax;

    if (coordinateMatch(x, y, iax, iay, tolerance)) {
        if(
            coordinateMatch(x, y, jax, jay, tolerance) || 
            coordinateMatch(x, y, jbx, jby, tolerance) || 
            ((uj >= 0) && (uj <= 1))
        ){
            return Point.valueOf(iax, iay)
        }
    } else if (coordinateMatch(x, y, ibx, iby, tolerance)) {
        if(
            coordinateMatch(x, y, jax, jay, tolerance) || 
            coordinateMatch(x, y, jbx, jby, tolerance) || 
            ((uj >= 0) && (uj <= 1))
        ){
            return Point.valueOf(ibx, iby)
        }
    } else if (coordinateMatch(x, y, jax, jay, tolerance)) {
        if ((ui >= 0) && (ui <= 1)) {
            return Point.valueOf(jax, jay)
        }
    } else if (coordinateMatch(x, y, ibx, jby, tolerance)) {
        if ((ui >= 0) && (ui <= 1)) {
            return Point.valueOf(jbx, jby)
        }
    } else if((ui > 0) && (ui < 1) && (uj > 0) && (uj < 1)) {
        return Point.valueOf(x, y)
    }
    return null
}


export function relateLineSegmentToPoint(lineSegment: LineSegmentBuilder, x: number, y: number, tolerance: number): Relation{
    const { ax, ay, bx, by } = lineSegment
    if (perpendicularDistance(x, y, ax, ay, bx, by) > tolerance){
        return DISJOINT
    }
    const target = { x: undefined, y: undefined }
    if (projectPointOntoLineSegment(x, y, ax, ay, bx, by, tolerance, target)) {
        let result = TOUCH
        if (coordinateMatch(x, y, bx, by, tolerance)) {
            result |= A_OUTSIDE_B
        } 
        return result
    }
    return DISJOINT
}


export function relateLineSegments(i: LineSegmentBuilder, j: LineSegmentBuilder, tolerance: number): Relation {
    const { ax: iax, ay: iay, bx: ibx, by: iby } = i
    const { ax: jax, ay: jay, bx: jbx, by: jby } = j
    
    const intersection = intersectionLine(i, j, true, tolerance);
    if (!intersection){
        return DISJOINT
    }
    const result = (
        TOUCH | 
        relateLineSegmentToPoint(i, jax, jay, tolerance) |
        relateLineSegmentToPoint(i, jbx, jby, tolerance) |
        flipAB(relateLineSegmentToPoint(j, iax, iay, tolerance)) |
        flipAB(relateLineSegmentToPoint(j, ibx, iby, tolerance))
    ) as Relation
    return result
}


export function getPointsOfIntersection(ax: number, ay: number, bx: number, by: number, target: number[]) {
    // for each point
    // for each line segment - should this also include rings?
    // for each line string - not rings!
    // for each ring
    // should this be something a geometry can do?
    // This feels better than a multi geometry conversion
    // We can always do a multi geometry build from this
} 

