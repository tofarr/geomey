import { ArrayCursor } from "../cursor/ArrayCoordinateCursor"
import { CoordinateCursor } from "../coordinate/CoordinateCursor"
import { isNaNOrInfinite, match } from "../ordinate"
import { NumberFormatter } from "../path/NumberFormatter"
import { Transformer } from "../transformer/Transformer"
import { Geometry } from "./Geometry"
import { InvalidGeometryError } from "./InvalidGeometryError"
import { LineString } from "./LineString"
import { MultiGeometry } from "./MultiGeometry"
import { Point } from "./Point"
import { PointBuilder } from "./PointBuilder"
import { Polygon } from "./Polygon"
import { RectangleBuilder } from "./RectangleBuilder"
import { A_INSIDE_B, B_INSIDE_A, B_OUTSIDE_A, DISJOINT, OUTSIDE_TOUCH, OVERLAP, Relation, TOUCH, flipAB } from "./Relation"
import { ArrayCoordinateStore } from "../coordinate/ArrayCoordinateStore"


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

    isCollapsible(accuracy: number): boolean {
        return this.getWidth() <= accuracy && this.getHeight() <= accuracy
    }

    generalize(accuracy: number): Point | Rectangle {
        if(this.isCollapsible(accuracy)){
            return this.getCentroid()
        }
        return this
    }

    getCoordinateStore() {
        const { minX, minY, maxX, maxY } = this
        return new ArrayCoordinateStore([
            minX, minY,
            maxX, minY,
            maxX, maxY,
            minX, maxY,
            minX, minY
        ])
    }

    transform(transformer: Transformer): Rectangle {
        const builder = new RectangleBuilder()
        this.getCoordinateStore().forEachObject((point) => {
            transformer(point)
            builder.unionPoint(point)
        })
        return builder.build()
    }

    relatePoint(point: PointBuilder, accuracy: number): Relation {
        const xRelation = relateValueToRange(this.minX, this.maxX, point.x, accuracy)
        if (xRelation === DISJOINT) {
            return DISJOINT
        }
        const yRelation = relateValueToRange(this.minY, this.maxY, point.y, accuracy)
        if (yRelation === DISJOINT) {
            return DISJOINT
        }
        if (xRelation == TOUCH || yRelation == TOUCH) {
            return TOUCH
        }
        return B_INSIDE_A
    }

    relateRectangle(other: Rectangle, accuracy: number): Relation {
        const xRelation = relateRanges(this.minX, this.maxX, other.minX, other.maxX, accuracy)
        if (xRelation === DISJOINT) {
            return DISJOINT
        }
        const yRelation = relateRanges(this.minY, this.maxY, other.minY, other.maxY, accuracy)
        if (yRelation === DISJOINT) {
            return DISJOINT
        }
        const overlap = xRelation & yRelation & OVERLAP
        const outsideTouch = (xRelation | yRelation) & OUTSIDE_TOUCH
        return (overlap | outsideTouch) as Relation
    }

    relate(other: Geometry, accuracy: number): Relation {
        return this.relateRectangle(other.getBounds(), accuracy)
    }

    union(other: Geometry, accuracy: number): Rectangle {
        const b = other.getBounds()
        return new Rectangle(
            Math.min(this.minX, b.minX),
            Math.min(this.minY, b.minY),
            Math.max(this.maxX, b.maxX),
            Math.max(this.maxY, b.maxY)
        )        
    }

    intersection(other: Geometry, accuracy: number): Rectangle | null {
        const b = other.getBounds()
        if (this.relateRectangle(b, accuracy) === DISJOINT) {
            return null
        }
        return Rectangle.valueOf(
            Math.max(this.minX, b.minX),
            Math.max(this.minY, b.minY),
            Math.min(this.maxX, b.maxX),
            Math.min(this.maxY, b.maxY)
        )
    }

    less(other: Geometry, accuracy: number): Geometry | null {
        return this.toPolygon().less(other, accuracy)
    }

    walkPath(pathWalker: PathWalker) {
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
            const outerRing = LineString.unsafeValueOf(this.getCoordinateStore())
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
function relateValueToRange(min: number, max: number, value: number, accuracy: number): Relation {
    if ((min - accuracy) > value || (max + accuracy) < value) {
        return DISJOINT
    }
    if (match(min, value, accuracy) || match(max, value, accuracy)){
        return TOUCH
    }
    return B_INSIDE_A
}

/** Determine if ranges overlap */
function relateRanges(minA: number, maxA: number, minB: number, maxB: number, accuracy: number) : Relation {
    let result = (
        relateValueToRange(minA, maxA, minB, accuracy) |
        relateValueToRange(minA, maxA, maxB, accuracy) |
        flipAB(relateValueToRange(minB, maxB, minA, accuracy)) |
        flipAB(relateValueToRange(minB, maxB, maxA, accuracy))
    ) as Relation
    // If both minA and maxA are inside B and not touching, then B is also inside A!
    if ((result & A_INSIDE_B) && !(result & B_INSIDE_A) && !match(minB, maxB, accuracy)) {
        result |= B_INSIDE_A
    }
    // If both minB and maxB are inside A and not touching, then A is also inside B!
    if ((result & B_INSIDE_A) && !(result & A_INSIDE_B) && !match(minA, maxA, accuracy)) {
        result |= A_INSIDE_B
    }
    return result
}
