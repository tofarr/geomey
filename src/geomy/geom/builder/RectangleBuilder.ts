import { forEachCoordinate } from "../../coordinate"
import { Rectangle } from "../Rectangle"

export interface IRectangle {
    minX: number
    minY: number
    maxX: number
    maxY: number
}


export class RectangleBuilder {
    minX: number = Infinity
    minY: number = Infinity
    maxX: number = -Infinity
    maxY: number = -Infinity

    union(x: number, y: number): RectangleBuilder{
        this.minX = Math.min(this.minX, x)
        this.minY = Math.min(this.minY, y)
        this.maxX = Math.max(this.maxX, x)
        this.maxY = Math.max(this.maxY, y)
        return this
    }

    unionCoordinates(coordinates: ReadonlyArray<number>): RectangleBuilder {
        forEachCoordinate(coordinates, (x, y) => { this.union(x, y) })
        return this
    }

    unionRectangle(rectangle: IRectangle): RectangleBuilder {
        this.union(rectangle.minX, rectangle.minY)
        this.union(rectangle.maxX, rectangle.maxY)
        return this
    }

    intersection(rectangle: IRectangle): RectangleBuilder {
        this.minX = Math.min(this.minX, rectangle.minX)
        this.minY = Math.min(this.minY, rectangle.minY)
        this.maxX = Math.max(this.maxX, rectangle.maxX)
        this.maxY = Math.max(this.maxY, rectangle.maxY)
        return this
    }

    build(): Rectangle | void {
        const { minX, minY, maxX, maxY } = this
        if(minX > maxX && minY > maxY){
            return null
        }
        return Rectangle.unsafeValueOf(minX, minY, maxX, maxY)
    }
}