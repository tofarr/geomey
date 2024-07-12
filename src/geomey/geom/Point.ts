import { isNaNOrInfinite, match } from "../coordinate";
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

    generalize(tolerance: number): Point {
        return this
    }

    transform(transformer: Transformer): Point {
        const { x, y } = this
        const builder = { x, y }
        transformer(builder)
        return Point.valueOf(builder.x, builder.y)
    }

    relatePoint(point: PointBuilder, tolerance: number): Relation {
        return pointsMatch(this.x, this.y, point.x, point.y, tolerance) ? TOUCH : DISJOINT
    }

    relate(other: Geometry, tolerance: number): Relation {
        return flipAB(other.relatePoint(this, tolerance))
    }

    union(other: Geometry, tolerance: number): Geometry {
        if (!(other.relatePoint(this, tolerance) & B_OUTSIDE_A)) {
            return other
        }
        const { points, lineStrings, polygons } = other.toMultiGeometry()
        const ordinates = points ? points.coordinates.slice() : []
        ordinates.push(this.x, this.y)
        const result = MultiGeometry.valueOf(
            MultiPoint.valueOf(ordinates), lineStrings, polygons
        )
        return result
    }

    intersection(other: Geometry, tolerance: number): Geometry {
        if (!(other.relatePoint(this, tolerance) & B_OUTSIDE_A)) {
            return other
        }
        return null
    }

    less(other: Geometry, tolerance: number): Geometry {
        return this.intersection(other, tolerance)
    }

    walkPath(pathWalker: PathWalker) {
        const { x, y } = this
        pathWalker.moveTo(x, y)
        pathWalker.lineTo(x, y)
    }

    toWkt(numberFormatter: NumberFormatter = NUMBER_FORMATTER): string {
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


export function pointsMatch(ax: number, ay: number, bx: number, by: number, tolerance: number): boolean {
    return match(ax, bx, tolerance) && match(ay, by, tolerance)
}
