import { Geometry, InvalidGeometryError, isNaNOrInfinite } from "./Geometry"
import { LineString } from "./LineString"
import { MultiPoint } from "./MultiPoint"
import { Point, PointBuilder, comparePointsForSort, match } from "./Point"
import { Polygon } from "./Polygon"
import { A_INSIDE_B, A_OUTSIDE_B, B_INSIDE_A, B_OUTSIDE_A, Relation, TOUCH, flipAB } from "./Relation"


export class Rectangle implements Geometry {
    readonly minX: number
    readonly minY: number
    readonly maxX: number
    readonly maxY: number
    centroid?: Point
    polygon?: Polygon

    constructor(minX: number, minY: number, maxX: number, maxY: number) {
        this.minX = minX
        this.minY = minY
        this.maxX = maxX
        this.maxY = maxY
        if (isNaNOrInfinite(minX, minY, maxX, maxY)){
            throw new InvalidGeometryError(this)
        }
    }

    contains(point: Point | PointBuilder) {
        return (
            point.x >= this.minX
            && point.y >= this.minY
            && point.x <= this.maxX
            && point.y <= this.maxY
        )
    }

    relatePoint(point: Point | PointBuilder, accuracy: number): Relation {
        let minX = this.minX - accuracy
        let minY = this.minY - accuracy
        let maxX = this.maxX + accuracy
        let maxY = this.maxY + accuracy
        const { x, y } = point
        if (x < minX || y < minY || x > maxX || y > maxY) {
            return A_OUTSIDE_B | B_OUTSIDE_A
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
        return result
    }

    getWidth() {
        return this.maxX - this.minX
    }

    getHeight() {
        return this.maxY - this.minY
    }

    isCollapsible(accuracy: number): boolean {
        return this.getWidth() <= accuracy && this.getHeight() <= accuracy
    }


    getCentroid() {
        let { centroid } = this
        if (!centroid) {
            centroid = this.centroid = new Point(
                (this.minX + this.maxX) / 2, 
                (this.minY + this.maxY) / 2
            )
        }
        return centroid
    }

    compareForSort(other: Rectangle) {
        const result = (
            comparePointsForSort(this.minX, this.minY, other.minX, other.minY) ||
            comparePointsForSort(this.maxX, this.maxY, other.maxX, other.maxY)
        )
        return result
    }

    getBounds(): Rectangle {
        return this
    }

    getArea(): number {
        return this.getWidth() * this.getHeight()
    }

    normalize(): Rectangle {
        return this
    }

    isValid(accuracy: number): boolean {
        return true
    }

    generalize(accuracy: number): Rectangle | Point {
        if (this.isCollapsible(accuracy)) {
            return this.getCentroid()
        }
        return this
    }

    toPolygon(): Polygon{
        let { polygon } = this
        if (!polygon) {
            const { minX, minY, maxX, maxY} = this
            const multiPoint = new MultiPoint(
                [
                    minX, minY,
                    maxX, minY,
                    maxX, maxY,
                    minX, maxY,
                    minX, minY
                ]
            )
            multiPoint.bounds = this
            const outerRing = new LineString(multiPoint)
            outerRing.bounds = this
            polygon = this.polygon = new Polygon(outerRing)
            polygon.bounds = this
        }
        return polygon
    }

    transform(transformer: (point: PointBuilder) => void): Rectangle {
        const builder = new RectangleBuilder()
        this.toPolygon().outerRing.pointList.forEachPoint((point) => {
            transformer(point)
            builder.union(point.x, point.y)
        })
        return builder.build()
    }

    relateRectangle(rectangle: Rectangle, accuracy: number): Relation {
        if (this.isCollapsible(accuracy)){
            return flipAB(rectangle.relatePoint(this.getCentroid(), accuracy))
        }
        if (rectangle.isCollapsible(accuracy)){
            return this.relatePoint(rectangle.getCentroid(), accuracy)
        }
        if (
            this.minX + accuracy > rectangle.maxX ||
            this.minY + accuracy > rectangle.maxY ||
            this.maxX + accuracy < rectangle.minX ||
            this.maxY + accuracy < rectangle.minY
        ) {
            return A_OUTSIDE_B | B_OUTSIDE_A
        }
        let result = A_INSIDE_B | B_INSIDE_A
        if (
            match(this.minX, rectangle.minX, accuracy) ||
            match(this.minX, rectangle.maxX, accuracy) ||
            match(this.maxX, rectangle.minX, accuracy) ||
            match(this.maxX, rectangle.maxX, accuracy) ||
            match(this.minY, rectangle.minY, accuracy) ||
            match(this.minY, rectangle.maxY, accuracy) ||
            match(this.maxY, rectangle.minY, accuracy) ||
            match(this.maxY, rectangle.maxY, accuracy)
        ) {
            result |= TOUCH
        }

        if (
            this.minX < (rectangle.minX - accuracy) ||
            this.minY < (rectangle.minY - accuracy) ||
            this.maxX > (rectangle.maxX + accuracy) ||
            this.maxY > (rectangle.maxY + accuracy)
        ) {
            result |= A_OUTSIDE_B
        }

        if (
            rectangle.minX < (this.minX - accuracy) ||
            rectangle.minY < (this.minY - accuracy) ||
            rectangle.maxX > (this.maxX + accuracy) ||
            rectangle.maxY > (this.maxY + accuracy)
        ) {
            result |= B_OUTSIDE_A
        }
        return result
    }

    relate(other: Geometry, accuracy: number): Relation {

    }

    union(other: Geometry, accuracy: number): Geometry
    intersection(other: Geometry, accuracy: number): Geometry | null
    less(other: Geometry, accuracy: number): Geometry | null
    toSvgPath(numberFormat: (n: number) => string, target: string[]): void
    toCanvasPath(context: any): void
    toWkt(numberFormat?: (n: number) => string): string
    toGeoJson(): any
    toMultiGeometry(): MultiGeometry
}


export class RectangleBuilder {
    minX: number = Infinity
    minY: number = Infinity
    maxX: number = -Infinity
    maxY: number = -Infinity

    build(): Rectangle | null {
        if (Number.isFinite(this.minX) && Number.isFinite(this.minY)) {
            return new Rectangle(this.minX, this.minY, this.maxX, this.maxY)
        }
        return null
    }

    union(x: number, y: number) {
        this.minX = Math.min(this.minX, x)
        this.minY = Math.min(this.minY, y)
        this.maxX = Math.min(this.maxX, x)
        this.maxY = Math.min(this.maxY, y)
        return this
    }

    unionRectangle(rectangle: Rectangle | null) {
        if(rectangle) {
            this.union(rectangle.minX, rectangle.minY)
            this.union(rectangle.maxX, rectangle.maxY)
        }
        return this
    }

    unionPoint(point: Point | PointBuilder) {
        return this.union(point.x, point.y)
    }
}
