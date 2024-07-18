import { LineSegmentConsumer, LineStringConsumer, LinearRingConsumer, PointConsumer } from "../consumer"
import { Transformer } from "../transformer/Transformer"
import { LineSegmentBuilder } from "./LineSegmentBuilder"
import { Point } from "./Point"
import { PointBuilder } from "./PointBuilder"
import { Rectangle } from "./Rectangle"
import { Relation } from "./Relation"


export interface Geometry {
    getCentroid(): Point
    getBounds(): Rectangle
    getArea(): number
    generalize(tolerance: Tolerance): Geometry
    transform(transformer: Transformer): Geometry
    relatePoint(point: PointBuilder, tolerance: Tolerance): Relation
    relateLineSegment(lineSegment: LineSegmentBuilder, tolerance: Tolerance): Relation
    relate(other: Geometry, tolerance: Tolerance): Relation
    union(other: Geometry, tolerance: Tolerance): Geometry
    intersection(other: Geometry, tolerance: Tolerance): Geometry | null
    less(other: Geometry, tolerance: Tolerance): Geometry | null
    forEachPoint(consumer: PointConsumer): boolean
    forEachLineSegment(consumer: LineSegmentConsumer): boolean
    forEachLineString(consumer: LineStringConsumer): boolean
    forEachLinearRing(consumer: LinearRingConsumer): boolean
}
