import { Point } from "../geom/Point";
import { PointBuilder } from "../geom/PointBuilder";
import { CoordinateStore } from "./CoordinateStore";


export class ArrayCoordinateStore implements CoordinateStore {
    protected coordinates: number[]

    constructor(coordinates: number[]) {
        this.coordinates = coordinates
    }

    async size(): Promise<number> {
        return this.coordinates.length >> 1
    }

    async get(index: number): Promise<[number, number]> {
        const { coordinates } = this
        index <<= 2
        return [coordinates[index++], coordinates[index]]
    }

    async forEach(consumer: (x: number, y: number) => boolean | void, startIndex?: number, endIndexExclusive?: number): Promise<number> {
        const { coordinates } = this
        startIndex = (startIndex == null) ? 0 : (startIndex << 1)
        endIndexExclusive = (endIndexExclusive == null) ? coordinates.length : (endIndexExclusive << 1)
        while(startIndex < endIndexExclusive){
            const result = consumer(coordinates[startIndex++], coordinates[startIndex++])
            if (result === false){
                break
            }
        }
        return startIndex >> 1
    }

    forEachObject(consumer: (result: PointBuilder) => boolean | void, startIndex?: number, endIndexExclusive?: number): Promise<number> {
        const result = { x: undefined, y: undefined }
        return this.forEach((x, y) => {
            result.x = x
            result.y = y
            return consumer(result)
        })
    }
}