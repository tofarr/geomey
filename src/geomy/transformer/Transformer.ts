import { PointBuilder } from "../builder/PointBuilder";


export interface Transformer {
    transform: (x: number, y: number) => [number, number]
    transformAll: (coordinates: ReadonlyArray<number>) => ReadonlyArray<number>
}
