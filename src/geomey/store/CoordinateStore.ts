import { PointBuilder } from "../geom/PointBuilder"


export type CoordinateVisitor = (x: number, y: number) => boolean | void

export type PointVisitor = (result: PointBuilder) => boolean | void

export interface CoordinateStore {
    size(): Promise<number>
    get(index: number): Promise<[number, number]>
    forEach(consumer: (x: number, y: number) => boolean | void, startIndex?: number, endIndexExclusive?: number): Promise<number>
    forEachObject(consumer: (result: PointBuilder) => boolean | void, startIndex?: number, endIndexExclusive?: number): Promise<number>
}
