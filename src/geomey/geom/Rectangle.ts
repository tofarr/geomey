import { isNaNOrInfinite, match } from "../coordinate"
import { NumberFormatter } from "../path/NumberFormatter"
import { Transformer } from "../transformer/Transformer"
import { Geometry } from "./Geometry"
import { InvalidGeometryError } from "./InvalidGeometryError"
import { LineString } from "./LineString"
import { MultiGeometry } from "./MultiGeometry"
import { Point } from "./Point"
import { PointBuilder, copyToPoint } from "./PointBuilder"
import { Polygon } from "./Polygon"
import { RectangleBuilder } from "./RectangleBuilder"
import { A_INSIDE_B, B_INSIDE_A, DISJOINT, OUTSIDE_TOUCH, OVERLAP, Relation, TOUCH, flipAB } from "./Relation"


export class Rectangle implements Geometry {
    readonly minX: number
    readonly minY: number
    readonly maxX: number
    readonly maxY: number
    private centroid?: Point
    private polygon?: Polygon

    constructor(minX: number, minY: number, maxX: number, maxY: number) {
        this.minX = minX
        this.minY = minY
        this.maxX = maxX
        this.maxY = maxY
    }
    
    static valueOf(minX: number, minY: number, maxX: number, maxY: number): Rectangle {
        if (minX > maxX) {
            const tmp = minX
            minX = maxX
            maxX = tmp
        }
        if (minY > maxY){
            const tmp = minY
            minY = maxY
            maxY = tmp
        }
        const result = new Rectangle(minX, minY, maxX, maxY)
        if (isNaNOrInfinite(minX, minY, maxX, maxY)){
            throw new InvalidGeometryError(result)
        }
        return result
    }

    static unsafeValueOf(minX: number, minY: number, maxX: number, maxY: number): Rectangle {
        return new Rectangle(minX, minY, maxX, maxY)
    }

    getCentroid(): Point {
        let { centroid } = this
        if (!centroid){
            centroid = this.centroid = Point.unsafeValueOf(
                (this.minX + this.maxX) / 2, 
                (this.minY + this.maxY , 2)
            )
        }
        return centroid
    }

    getBounds(): Rectangle {
        return this
    }

    getWidth() {
        return this.maxX - this.minX
    }

    getHeight() {
        return this.maxY - this.minY
    }

    getArea(): number {
        return this.getWidth() * this.getHeight()
    }

    isCollapsible(tolerance: Tolerance): boolean {
        return this.getWidth() <= tolerance && this.getHeight() <= tolerance
    }

    generalize(tolerance: Tolerance): Point | Rectangle {
        if(this.isCollapsible(tolerance)){
            return this.getCentroid()
        }
        return this
    }

    getCoordinates() {
        const { minX, minY, maxX, maxY } = this
        return [
            minX, minY,
            maxX, minY,
            maxX, maxY,
            minX, maxY,
            minX, minY
        ]
    }

    transform(transformer: Transformer): Rectangle {
        const builder = new RectangleBuilder()
        let index = 0;
        let coordinates = this.getCoordinates()
        const point = { x: undefined, y: undefined }
        while(index < coordinates.length){
            copyToPoint(coordinates[index++], coordinates[index++], point)
            transformer(point)
            builder.unionPoint(point)
        }
        return builder.build()
    }

    relatePoint(point: PointBuilder, tolerance: Tolerance): Relation {
        const xRelation = relateValueToRange(this.minX, this.maxX, point.x, tolerance)
        if (xRelation === DISJOINT) {
            return DISJOINT
        }
        const yRelation = relateValueToRange(this.minY, this.maxY, point.y, tolerance)
        if (yRelation === DISJOINT) {
            return DISJOINT
        }
        if (xRelation == TOUCH || yRelation == TOUCH) {
            return TOUCH
        }
        return B_INSIDE_A
    }

    relateRectangle(other: Rectangle, tolerance: Tolerance): Relation {
        const xRelation = relateRanges(this.minX, this.maxX, other.minX, other.maxX, tolerance)
        if (xRelation === DISJOINT) {
            return DISJOINT
        }
        const yRelation = relateRanges(this.minY, this.maxY, other.minY, other.maxY, tolerance)
        if (yRelation === DISJOINT) {
            return DISJOINT
        }
        const overlap = xRelation & yRelation & OVERLAP
        const outsideTouch = (xRelation | yRelation) & OUTSIDE_TOUCH
        return (overlap | outsideTouch) as Relation
    }

    relate(other: Geometry, tolerance: Tolerance): Relation {
        return this.relateRectangle(other.getBounds(), tolerance)
    }

    union(other: Geometry, tolerance: Tolerance): Rectangle {
        const b = other.getBounds()
        return new Rectangle(
            Math.min(this.minX, b.minX),
            Math.min(this.minY, b.minY),
            Math.max(this.maxX, b.maxX),
            Math.max(this.maxY, b.maxY)
        )        
    }

    intersection(other: Geometry, tolerance: Tolerance): Rectangle | null {
        const b = other.getBounds()
        if (this.relateRectangle(b, tolerance) === DISJOINT) {
            return null
        }
        return Rectangle.valueOf(
            Math.max(this.minX, b.minX),
            Math.max(this.minY, b.minY),
            Math.min(this.maxX, b.maxX),
            Math.min(this.maxY, b.maxY)
        )
    }

    less(other: Geometry, tolerance: Tolerance): Geometry | null {
        return this.toPolygon().less(other, tolerance)
    }

    walkPath(pathWalker: PathWalker): void {
        const { minX, minY, maxX, maxY } = this
        pathWalker.moveTo(minX, minY)
        pathWalker.lineTo(maxX, minY)
        pathWalker.lineTo(maxX, maxY)
        pathWalker.lineTo(minX, maxY)
    }

    toWkt(numberFormatter: NumberFormatter): string {
        return this.toPolygon().toWkt(numberFormatter)
    }

    toPolygon(): Polygon {
        let { polygon } = this
        if (!polygon) {
            const { minX, minY, maxX, maxY } = this
            const outerRing = LineString.unsafeValueOf(this.getCoordinates())
            polygon = this.polygon = Polygon.unsafeValueOf(outerRing)
        }
        return polygon
    }

    toGeoJson(): any {
        return this.toPolygon().toGeoJson()
    }

    toMultiGeometry(): MultiGeometry {
        return this.toPolygon().toMultiGeometry()
    }
}


/** Determine if a value is touching, inside, or disjoint from a range */
function relateValueToRange(min: number, max: number, value: number, tolerance: Tolerance): Relation {
    if ((min - tolerance) > value || (max + tolerance) < value) {
        return DISJOINT
    }
    if (match(min, value, tolerance) || match(max, value, tolerance)){
        return TOUCH
    }
    return B_INSIDE_A
}

/** Determine if ranges overlap */
function relateRanges(minA: number, maxA: number, minB: number, maxB: number, tolerance: Tolerance) : Relation {
    let result = (
        relateValueToRange(minA, maxA, minB, tolerance) |
        relateValueToRange(minA, maxA, maxB, tolerance) |
        flipAB(relateValueToRange(minB, maxB, minA, tolerance)) |
        flipAB(relateValueToRange(minB, maxB, maxA, tolerance))
    ) as Relation
    // If both minA and maxA are inside B and not touching, then B is also inside A!
    if ((result & A_INSIDE_B) && !(result & B_INSIDE_A) && !match(minB, maxB, tolerance)) {
        result |= B_INSIDE_A
    }
    // If both minB and maxB are inside A and not touching, then A is also inside B!
    if ((result & B_INSIDE_A) && !(result & A_INSIDE_B) && !match(minA, maxA, tolerance)) {
        result |= A_INSIDE_B
    }
    return result
}
