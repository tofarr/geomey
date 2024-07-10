import { isNaNOrInfinite } from "../ordinate"
import { NumberFormatter } from "../path/NumberFormatter"
import { Transformer } from "../transformer/Transformer"
import { Geometry } from "./Geometry"
import { InvalidGeometryError } from "./InvalidGeometryError"
import { MultiGeometry } from "./MultiGeometry"
import { Point } from "./Point"
import { PointBuilder } from "./PointBuilder"
import { PointVisitor } from "./PointVisitor"
import { Polygon } from "./Polygon"
import { RectangleBuilder } from "./RectangleBuilder"
import { A_OUTSIDE_B, B_OUTSIDE_A, DISJOINT, Relation, TOUCH } from "./Relation"


export class Rectangle implements Geometry {
    readonly minX: number
    readonly minY: number
    readonly maxX: number
    readonly maxY: number
    private centroid?: Point

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

    forEachPoint(visitor: PointVisitor) {
        const point = { x: this.minX, y: this.minY }
        if(visitor(point) === false) {
            return false
        }
        point.x = this.maxX
        if(visitor(point) === false) {
            return false
        }
        point.y = this.maxY
        if(visitor(point) === false) {
            return false
        }
        point.x = this.minX
        return visitor(point)
        
    }

    transform(transformer: Transformer): Rectangle {
        const builder = new RectangleBuilder()
        this.forEachPoint((point: PointBuilder) => {
            transformer(point)
            builder.union(point.x, point.y)
        })
        return builder.build()
    }

    relatePoint(point: PointBuilder, accuracy: number): Relation {
        if (this.isCollapsible(accuracy)) {
            return this.getCentroid().relatePoint(point, accuracy)
        }
        let minX = this.minX - accuracy
        let minY = this.minY - accuracy
        let maxX = this.maxX + accuracy
        let maxY = this.maxY + accuracy
        const { x, y } = point
        if (x < minX || y < minY || x > maxX || y > maxY) {
            return DISJOINT
        }
        minX = this.minX + accuracy
        minY = this.minY + accuracy
        maxX = this.maxX - accuracy
        maxY = this.maxY - accuracy
        let result = 0
        if (x <= minX || y <= minY || x >= maxX || y >= maxY) {
            result = TOUCH
        }
        if(minX < x || minY < y || maxX > x || maxY > y){
            result |= B_OUTSIDE_A
        }
        return result as Relation
    }

    relateRectangle(other: Rectangle, accuracy: number): Relation {
        throw new Error('NotYetImplemented')
    }

    relate(other: Geometry, accuracy: number): Relation {
        return this.relateRectangle(other.getBounds(), accuracy)
    }

    union(other: Geometry, accuracy: number): Rectangle {
        throw new Error('NotYetImplemented')
    }

    intersection(other: Geometry, accuracy: number): Rectangle | null {
        throw new Error('NotYetImplemented')
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
        throw new Error('NotYetImplemented')
    }

    toPolygon(): Polygon {
        throw new Error('NotYetImplemented')
    }

    toGeoJson(): any {
        return this.toPolygon().toGeoJson()
    }

    toMultiGeometry(): MultiGeometry {
        return this.toPolygon().toMultiGeometry()
    }
}
