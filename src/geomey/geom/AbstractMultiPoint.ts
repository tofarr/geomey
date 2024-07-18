import { CoordinateConsumer, forEachCoordinate } from "../coordinate";
import { NumberFormatter } from "../path/NumberFormatter";
import { Transformer } from "../transformer/Transformer";
import { AbstractGeometry } from "./AbstractGeometry";
import { Geometry } from "./Geometry";
import { LineSegment } from "./LineSegment";
import { MultiGeometry } from "./MultiGeometry";
import { Point } from "./Point";
import { PointBuilder, copyToPoint, forEachPoint } from "./PointBuilder";
import { Rectangle } from "./Rectangle";
import { RectangleBuilder } from "./RectangleBuilder";
import { Relation } from "./Relation";


export abstract class AbstractMultiPoint extends AbstractGeometry implements Geometry {
    readonly coordinates: ReadonlyArray<number>

    protected constructor(coordinates: ReadonlyArray<number>) {
        super()
        this.coordinates = coordinates
    }

    forEachCoordinate(consumer: CoordinateConsumer, fromIndexInclusive?: number, toIndexExclusive?: number): number {
        return forEachCoordinate(this.coordinates, consumer, fromIndexInclusive, toIndexExclusive)
    }

    forEachPoint(consumer: (point: PointBuilder, index: number) => boolean | void, fromIndexInclusive?: number, toIndexExclusive?: number): number {
        return forEachPoint(this.coordinates, consumer, fromIndexInclusive, toIndexExclusive)   
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

    abstract calculateGeneralized(tolerance: Tolerance): Geometry
    abstract transform(transformer: Transformer): Geometry
    abstract relatePoint(point: PointBuilder, tolerance: Tolerance): Relation
    abstract relateLineSegment(lineSegment: LineSegment, tolerance: Tolerance): Relation
    abstract relate(other: Geometry, tolerance: Tolerance): Relation
    abstract union(other: Geometry, tolerance: Tolerance): Geometry
    abstract intersection(other: Geometry, tolerance: Tolerance): Geometry | null
    abstract less(other: Geometry, tolerance: Tolerance): Geometry | null
    abstract walkPath(pathWalker: PathWalker): void
    abstract toWkt(numberFormatter?: NumberFormatter): string
    abstract toGeoJson(): any
    abstract toMultiGeometry(): MultiGeometry
}