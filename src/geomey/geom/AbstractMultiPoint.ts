import { NumberFormatter } from "../path/NumberFormatter";
import { Transformer } from "../transformer/Transformer";
import { AbstractGeometry } from "./AbstractGeometry";
import { Geometry } from "./Geometry";
import { MultiGeometry } from "./MultiGeometry";
import { Point } from "./Point";
import { PointBuilder, copyToPoint } from "./PointBuilder";
import { Rectangle } from "./Rectangle";
import { RectangleBuilder } from "./RectangleBuilder";
import { Relation } from "./Relation";


export abstract class AbstractMultiPoint extends AbstractGeometry implements Geometry {
    readonly coordinates: ReadonlyArray<number>

    protected constructor(coordinates: ReadonlyArray<number>) {
        super()
        this.coordinates = coordinates
    }

    forEachCoordinate(consumer: (x: number, y: number) => boolean | void, fromIndexInclusive?: number, toIndexExclusive?: number): number {
        const { coordinates } = this
        fromIndexInclusive = (fromIndexInclusive == null) ? 0 : (fromIndexInclusive << 1)
        toIndexExclusive = (toIndexExclusive == null) ? coordinates.length : (toIndexExclusive << 1)
        while(fromIndexInclusive < toIndexExclusive){
            const result = consumer(coordinates[fromIndexInclusive++], coordinates[fromIndexInclusive++])
            if (result === false){
                break
            }
        }
        return fromIndexInclusive >> 1
    }

    forEachPoint(consumer: (point: PointBuilder, index: number) => boolean | void, fromIndexInclusive?: number, toIndexExclusive?: number): number {
        const point = { x: undefined, y: undefined }
        fromIndexInclusive ||= 0
        return this.forEachCoordinate((x, y) => {
            copyToPoint(x, y, point)
            return consumer(point, fromIndexInclusive++)
        }), fromIndexInclusive, toIndexExclusive
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

    abstract calculateGeneralized(tolerance: number): Geometry
    abstract transform(transformer: Transformer): Geometry
    abstract relatePoint(point: PointBuilder, tolerance: number): Relation
    abstract relate(other: Geometry, tolerance: number): Relation
    abstract union(other: Geometry, tolerance: number): Geometry
    abstract intersection(other: Geometry, tolerance: number): Geometry | null
    abstract less(other: Geometry, tolerance: number): Geometry | null
    abstract walkPath(pathWalker: PathWalker): void
    abstract toWkt(numberFormatter?: NumberFormatter): string
    abstract toGeoJson(): any
    abstract toMultiGeometry(): MultiGeometry
}