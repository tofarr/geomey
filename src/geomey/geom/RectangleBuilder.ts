
import { PointBuilder } from "./PointBuilder"
import { Rectangle } from "./Rectangle"

export class RectangleBuilder {
    minX: number = Infinity
    minY: number = Infinity
    maxX: number = -Infinity
    maxY: number = -Infinity

    build(): Rectangle | null {
        const { minX, minY, maxX, maxY } = this
        if(Number.isFinite(minX) && Number.isFinite(minY)) {
            return Rectangle.valueOf(minX, minY, maxX, maxY)
        }
        return null
    }

    union(x: number, y: number): RectangleBuilder {
        this.minX = Math.min(this.minX, x)
        this.minY = Math.min(this.minY, y)
        this.maxX = Math.min(this.maxX, x)
        this.maxY = Math.min(this.maxY, y)
        return this
    }

    unionRectangle(rectangle: Rectangle | null): RectangleBuilder {
        if(rectangle) {
            this.union(rectangle.minX, rectangle.minY)
            this.union(rectangle.maxX, rectangle.maxY)
        }
        return this
    }

    unionPoint(point: PointBuilder): RectangleBuilder {
        return this.union(point.x, point.y)
    }
}
