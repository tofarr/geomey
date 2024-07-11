import { isNaNOrInfinite, match } from "../ordinate";
import { NUMBER_FORMATTER, NumberFormatter } from "../path/NumberFormatter";
import { newWritableStore } from "../store/WritableCoordinateStore";
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

    async getCentroid(): Promise<Point> {
        return this
    }

    async getBounds(): Promise<Rectangle> {
        let { bounds } = this
        if (!bounds){
            const { x, y } = this
            bounds = this.bounds = Rectangle.unsafeValueOf(x, y, x, y)
        }
        return bounds
    }

    async getArea(): Promise<number> {
        return 0
    }

    async generalize(): Promise<Point> {
        return this
    }

    async transform(transformer: Transformer): Promise<Point> {
        const { x, y } = this
        const builder = { x, y }
        transformer(builder)
        return Point.valueOf(builder.x, builder.y)
    }

    async relatePoint(point: PointBuilder, accuracy: number): Promise<Relation> {
        return isPointsTouching(this.x, this.y, point.x, point.y, accuracy) ? TOUCH : DISJOINT
    }

    async relate(other: Geometry, accuracy: number): Promise<Relation> {
        return flipAB(await other.relatePoint(this, accuracy))
    }

    async union(other: Geometry, accuracy: number): Promise<Geometry> {
        if (!(await other.relatePoint(this, accuracy) & B_OUTSIDE_A)) {
            return other
        }
        const { points, lineStrings, polygons } = await other.toMultiGeometry()
        let newCoordinates
        if (points) {
            const coordinates = points.coordinates
            newCoordinates = await newWritableStore(1 + await coordinates.size())
            newCoordinates.appendAll(coordinates)
        } else {
            newCoordinates = await newWritableStore(1)
        }
        await newCoordinates.append(this)
        const result = MultiGeometry.valueOf(
            await MultiPoint.valueOf(newCoordinates), lineStrings, polygons
        )
        return result
    }

    async intersection(other: Geometry, accuracy: number): Promise<Geometry> {
        if (!(await other.relatePoint(this, accuracy) & B_OUTSIDE_A)) {
            return other
        }
        return null
    }

    less(other: Geometry, accuracy: number): Promise<Geometry> {
        return this.intersection(other, accuracy)
    }

    async walkPath(pathWalker: PathWalker): Promise<PathWalker> {
        const { x, y } = this
        pathWalker.moveTo(x, y)
        pathWalker.lineTo(x, y)
        return pathWalker
    }

    async toWkt(numberFormatter: NumberFormatter = NUMBER_FORMATTER): Promise<string> {
        return `POINT (${numberFormatter(this.x)} ${numberFormatter(this.y)})`
    }

    async toGeoJson(): Promise<any> {
        return {
            type: "Point",
            coordinates: [this.x, this.y]
        }
    }

    async toMultiGeometry(): Promise<MultiGeometry> {
        return MultiGeometry.unsafeValueOf(
            MultiPoint.unsafeValueOf([this.x, this.y])
        )
    }    
}


export const ORIGIN = Point.unsafeValueOf(0, 0)


export function isPointsTouching(ax: number, ay: number, bx: number, by: number, accuracy: number): boolean {
    return match(ax, bx, accuracy) && match(ay, by, accuracy)
}
