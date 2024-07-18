import { DISJOINT, Relation, TOUCH, flipAB } from "../Relation";
import { Tolerance } from "../Tolerance";
import { coordinateMatch, isNaNOrInfinite } from "../coordinate";
import { NUMBER_FORMATTER, NumberFormatter } from "../formatter";
import { Transformer } from "../transformer/Transformer";
import { Geometry } from "./Geometry";
import { InvalidGeometryError } from "./InvalidGeometryError";
import { MultiGeometry } from "./MultiGeometry";
import { Rectangle } from "./Rectangle";


export class Point implements Geometry {
    readonly x: number
    readonly y: number
    private bounds?: Rectangle
    private multiGeometry?: MultiGeometry

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
    walkPath(pathWalker: PathWalker): void {
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
    toMultiGeometry(): MultiGeometry {
        let { multiGeometry } = this
        if (!multiGeometry) {
            this.multiGeometry = multiGeometry = MultiGeometry.unsafeValueOf(
                [this.x, this.y]
            )
        }
        return multiGeometry
    }
    transform(transformer: Transformer): Point {
        const [x, y] = transformer.transform(this.x, this.y)
        return Point.valueOf(x, y)
    }
    generalize(): Geometry {
        return this
    }
    relate(other: Geometry, tolerance: Tolerance): Relation {
        if (other instanceof Point) {
            return coordinateMatch(this.x, this.y, other.x, other.y, tolerance) ? TOUCH : DISJOINT
        } else if (other instanceof Rectangle) {
            return flipAB(other.relatePoint(this, tolerance))
        }
        return this.toMultiGeometry().relate(other, tolerance)
    }
    union(other: Geometry, tolerance: Tolerance): Geometry {
        if (this.relate(other, tolerance) == DISJOINT){
            return this.toMultiGeometry().union(other, tolerance)
        }
        return other
    }
    intersection(other: Geometry, tolerance: Tolerance): Geometry | null {
        if (this.relate(other, tolerance) == DISJOINT){
            return null
        }
        return other
    }
    less(other: Geometry, tolerance: Tolerance): Geometry | null {
        if (this.relate(other, tolerance) == DISJOINT){
            return null
        }
        return other
    }
}


export type PointConsumer = (point: Point) => boolean | void
