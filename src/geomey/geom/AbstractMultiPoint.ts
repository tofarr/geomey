import { NumberFormatter } from "../path/NumberFormatter";
import { CoordinateStore } from "../store/CoordinateStore";
import { Transformer } from "../transformer/Transformer";
import { AbstractGeometry } from "./AbstractGeometry";
import { Geometry } from "./Geometry";
import { MultiGeometry } from "./MultiGeometry";
import { Point } from "./Point";
import { PointBuilder } from "./PointBuilder";
import { Rectangle } from "./Rectangle";
import { RectangleBuilder } from "./RectangleBuilder";
import { Relation } from "./Relation";


export abstract class AbstractMultiPoint extends AbstractGeometry implements Geometry {
    readonly coordinates: CoordinateStore

    protected constructor(coordinates: CoordinateStore) {
        super()
        this.coordinates = coordinates
    }

    async calculateCentroid(): Promise<Point> {
        const { coordinates } = this
        let sumX = 0
        let sumY = 0
        await this.coordinates.forEach((x, y) => {
            sumX += x
            sumY += y
        })
        const numPoints = await coordinates.size()
        return Point.unsafeValueOf(sumX / numPoints, sumY / numPoints)
    }

    async calculateBounds(): Promise<Rectangle> {
        const builder = new RectangleBuilder()
        await this.coordinates.forEach((x, y) => { builder.union(x, y) })
        return builder.build()
    }

    async calculateArea(): Promise<number> {
        return 0
    }

    abstract calculateGeneralized(accuracy: number): Promise<Geometry>
    abstract transform(transformer: Transformer): Promise<Geometry>
    abstract relatePoint(point: Point, accuracy: number): Promise<Relation>
    abstract relate(other: Geometry, accuracy: number): Promise<Relation>
    abstract union(other: Geometry, accuracy: number): Promise<Geometry>
    abstract intersection(other: Geometry, accuracy: number): Promise<Geometry | null>
    abstract less(other: Geometry, accuracy: number): Promise<Geometry | null>
    abstract walkPath(pathWalker: PathWalker): Promise<PathWalker>
    abstract toWkt(numberFormat?: NumberFormatter): Promise<string>
    abstract toGeoJson(): Promise<any>
    abstract toMultiGeometry(): Promise<MultiGeometry>
}