import { NumberFormatter } from "../path/NumberFormatter"
import { Transformer } from "../transformer/Transformer"
import { MultiGeometry } from "./MultiGeometry"
import { Point } from "./Point"
import { PointBuilder } from "./PointBuilder"
import { Rectangle } from "./Rectangle"
import { Relation } from "./Relation"


export interface Geometry {
    getCentroid(): Point
    getBounds(): Rectangle
    getArea(): number
    generalize(accuracy: number): Geometry
    transform(transformer: Transformer): Geometry
    relatePoint(point: PointBuilder, accuracy: number): Relation
    relate(other: Geometry, accuracy: number): Relation
    union(other: Geometry, accuracy: number): Geometry
    intersection(other: Geometry, accuracy: number): Geometry | null
    less(other: Geometry, accuracy: number): Geometry | null
    walkPath(pathWalker: PathWalker)
    toWkt(numberFormatter: NumberFormatter): string
    toGeoJson(): any
    toMultiGeometry(): MultiGeometry
}
