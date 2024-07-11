import { CoordinateStore } from "../coordinate/CoordinateStore";
import { NumberFormatter } from "../path/NumberFormatter";
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
    readonly coordinates: ReadonlyArray<number>

    protected constructor(coordinates: ReadonlyArray<number>) {
        super()
        this.coordinates = coordinates
    }

    calculateCentroid(): Point {
        const { coordinates } = this
        const { length } = coordinates
        let sumX = 0
        let sumY = 0
        let index = 0
        while(index < length){
            sumX += coordinates[index++]
            sumY += coordinates[index++]
        }
        return Point.unsafeValueOf(sumX / length, sumY / length)
    }

    calculateBounds(): Rectangle {
        const builder = new RectangleBuilder()
        this.coordinates.forEach((x, y) => { builder.union(x, y) })
        return builder.build()
    }

    calculateArea(): number {
        return 0
    }

    abstract calculateGeneralized(accuracy: number): Geometry
    abstract transform(transformer: Transformer): Geometry
    abstract relatePoint(point: PointBuilder, accuracy: number): Relation
    abstract relate(other: Geometry, accuracy: number): Relation
    abstract union(other: Geometry, accuracy: number): Geometry
    abstract intersection(other: Geometry, accuracy: number): Geometry | null
    abstract less(other: Geometry, accuracy: number): Geometry | null
    abstract walkPath(pathWalker: PathWalker): void
    abstract toWkt(numberFormatter?: NumberFormatter): string
    abstract toGeoJson(): any
    abstract toMultiGeometry(): MultiGeometry
}