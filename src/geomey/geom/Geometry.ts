import { NumberFormatter } from "../path/NumberFormatter"
import { Transformer } from "../transformer/Transformer"
import { MultiGeometry } from "./MultiGeometry"
import { Point } from "./Point"
import { PointBuilder } from "./PointBuilder"
import { Rectangle } from "./Rectangle"
import { Relation } from "./Relation"


export interface Geometry {
    getCentroid(): Promise<Point>
    getBounds(): Promise<Rectangle>
    getArea(): Promise<number>
    generalize(accuracy: number): Promise<Geometry>
    transform(transformer: Transformer): Promise<Geometry>
    relatePoint(point: PointBuilder, accuracy: number): Promise<Relation>
    relate(other: Geometry, accuracy: number): Promise<Relation>
    union(other: Geometry, accuracy: number): Promise<Geometry>
    intersection(other: Geometry, accuracy: number): Promise<Geometry | null>
    less(other: Geometry, accuracy: number): Promise<Geometry | null>
    walkPath(pathWalker: PathWalker): Promise<PathWalker>
    toWkt(numberFormatter?: NumberFormatter): Promise<string>
    toGeoJson(): Promise<any>
    toMultiGeometry(): Promise<MultiGeometry>
}
