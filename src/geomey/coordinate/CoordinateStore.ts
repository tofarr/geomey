import { PointBuilder } from "../geom/PointBuilder"
import { CoordinateCursor } from "./CoordinateCursor"


export interface CoordinateStore {
    size(): number
    get(index: number, result: PointBuilder): PointBuilder
    forEach(consumer: (x: number, y: number) => boolean | void, startIndex?: number, endIndexExclusive?: number): void
    forEachObject(consumer: (result: PointBuilder) => boolean | void, startIndex?: number, endIndexExclusive?: number): void
}