import { isNaNOrInfinite, match } from "../ordinate";
import { NUMBER_FORMATTER, NumberFormatter } from "../path/NumberFormatter";
import { Transformer } from "../transformer/Transformer";
import { Geometry } from "./Geometry";
import { InvalidGeometryError } from "./InvalidGeometryError";
import { MultiGeometry } from "./MultiGeometry";
import { MultiPoint } from "./MultiPoint";
import { PointBuilder } from "./PointBuilder";
import { Rectangle } from "./Rectangle";
import { B_OUTSIDE_A, DISJOINT, Relation, TOUCH, flipAB } from "./Relation";


export class Point implements Geometry {
    readonly x: number
    readonly y: number
    private bounds?: Rectangle
    
    private constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }

    static valueOf(x: number, y: number): Point {
        const result = new Point(x, y)
        if (isNaNOrInfinite(x, y)) {
            throw new InvalidGeometryError(result)
        }
        return result
    }

    static unsafeValueOf(x: number, y: number): Point {
        return new Point(x, y)
    }

    getCentroid(): Point {
        return this
    }

    getBounds(): Rectangle {
        let { bounds } = this
        if (!bounds){
            const { x, y } = this
            bounds = this.bounds = Rectangle.unsafeValueOf(x, y, x, y)
        }
        return bounds
    }

    getArea(): number {
        return 0
    }

    generalize(accuracy: number): Point {
        return this
    }

    transform(transformer: Transformer): Point {
        const { x, y } = this
        const builder = { x, y }
        transformer(builder)
        return Point.valueOf(builder.x, builder.y)
    }

    relatePoint(point: PointBuilder, accuracy: number): Relation {
        return isPointsTouching(this.x, this.y, point.x, point.y, accuracy) ? TOUCH : DISJOINT
    }

    relate(other: Geometry, accuracy: number): Relation {
        return flipAB(other.relatePoint(this, accuracy))
    }

    union(other: Geometry, accuracy: number): Geometry {
        if (!(other.relatePoint(this, accuracy) & B_OUTSIDE_A)) {
            return other
        }
        const { points, lineStrings, polygons } = other.toMultiGeometry()
        const ordinates = points ? points.ordinates.slice() : []
        ordinates.push(this.x, this.y)
        const result = MultiGeometry.valueOf(
            MultiPoint.valueOf(ordinates), lineStrings, polygons
        )
        return result
    }

    intersection(other: Geometry, accuracy: number): Geometry {
        if (!(other.relatePoint(this, accuracy) & B_OUTSIDE_A)) {
            return other
        }
        return null
    }

    less(other: Geometry, accuracy: number): Geometry {
        return this.intersection(other, accuracy)
    }

    walkPath(pathWalker: PathWalker) {
        const { x, y } = this
        pathWalker.moveTo(x, y)
        pathWalker.lineTo(x, y)
    }

    toWkt(numberFormatter?: NumberFormatter): string {
        if(!numberFormatter) {
            numberFormatter = NUMBER_FORMATTER
        }
        return `POINT (${numberFormatter(this.x)} ${numberFormatter(this.y)})`
    }

    toGeoJson() {
        return {
            type: "Point",
            coordinates: [this.x, this.y]
        }
    }

    toMultiGeometry() {
        return MultiGeometry.unsafeValueOf(
            MultiPoint.unsafeValueOf([this.x, this.y])
        )
    }    
}


export const ORIGIN = Point.unsafeValueOf(0, 0)


export function isPointsTouching(ax: number, ay: number, bx: number, by: number, accuracy: number): boolean {
    return match(ax, bx, accuracy) && match(ay, by, accuracy)
}
