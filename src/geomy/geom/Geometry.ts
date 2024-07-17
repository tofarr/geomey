import { LineSegmentConsumer, LineStringConsumer, LinearRingConsumer, PointConsumer } from "../coordinate"

export interface Geometry {
    getCentroid(): Point
    getBounds(): Rectangle
    getArea(): number
    generalize(tolerance: number): Geometry
    transform(transformer: Transformer): Geometry
    relatePoint(point: PointBuilder, tolerance: number): Relation
    relateLineSegment(lineSegment: LineSegmentBuilder, tolerance: number): Relation
    relate(other: Geometry, tolerance: number): Relation
    union(other: Geometry, tolerance: number): Geometry
    intersection(other: Geometry, tolerance: number): Geometry | null
    less(other: Geometry, tolerance: number): Geometry | null
    forEachPoint(consumer: PointConsumer): boolean
    forEachLineSegment(consumer: LineSegmentConsumer): boolean
    forEachLineString(consumer: LineStringConsumer): boolean
    forEachLinearRing(consumer: LinearRingConsumer): boolean
}
