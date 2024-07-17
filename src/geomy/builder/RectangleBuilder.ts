
import { PointBuilder } from "./PointBuilder"


export class RectangleBuilder {
    minX: number = Infinity
    minY: number = Infinity
    maxX: number = -Infinity
    maxY: number = -Infinity

    union(x: number, y: number): RectangleBuilder {
        this.minX = Math.min(this.minX, x)
        this.minY = Math.min(this.minY, y)
        this.maxX = Math.max(this.maxX, x)
        this.maxY = Math.max(this.maxY, y)
        return this
    }

    unionRectangle(rectangle: RectangleBuilder | null): RectangleBuilder {
        if(rectangle) {
            this.union(rectangle.minX, rectangle.minY)
            this.union(rectangle.maxX, rectangle.maxY)
        }
        return this
    }

    unionPoint(point: PointBuilder | null): RectangleBuilder {
        if (point) {
            this.union(point.x, point.y)
        }
        return this
    }

    reset(): RectangleBuilder {
        this.minX = this.minY = Infinity
        this.maxX = this.maxY = -Infinity
        return this
    }

    intersection(other: RectangleBuilder | null): RectangleBuilder {
        if (!other || rectanglesDisjoint(this, other)){
            return this.reset()
        }else {
            this.minX = Math.max(this.minX, other.minX)
            this.minY = Math.max(this.minY, other.minY)
            this.maxX = Math.min(this.maxX, other.maxX)
            this.maxY = Math.min(this.maxY, other.maxY)
        }
        return this
    }
}


export function rectanglesDisjoint(a: RectangleBuilder, b: RectangleBuilder): boolean {
    return (a.minX > b.maxX) || (a.maxX < b.minY) || (a.minY > b.maxY) || (a.maxY < b.minY)
}
