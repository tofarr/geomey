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
    generalize(tolerance: number): Geometry
    transform(transformer: Transformer): Geometry
    relatePoint(point: PointBuilder, tolerance: number): Relation
    relate(other: Geometry, tolerance: number): Relation
    union(other: Geometry, tolerance: number): Geometry
    intersection(other: Geometry, tolerance: number): Geometry | null
    less(other: Geometry, tolerance: number): Geometry | null
    walkPath(pathWalker: PathWalker)
    toWkt(numberFormatter?: NumberFormatter): string
    toGeoJson(): any
    toMultiGeometry(): MultiGeometry
}
