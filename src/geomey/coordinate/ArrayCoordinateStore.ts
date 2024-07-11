import { PointBuilder } from "../geom/PointBuilder";
import { CoordinateCursor } from "./CoordinateCursor";
import { CoordinateStore } from "./CoordinateStore";


export class ArrayCoordinateStore implements CoordinateStore {
    protected coordinates: number[]

    constructor(coordinates: number[]) {
        this.coordinates = coordinates
    }

    size(): number {
        return this.coordinates.length >> 1
    }

    get(index: number, result: PointBuilder): PointBuilder {
        const { coordinates } = this
        index *= 2
        result.x = coordinates[index++]
        result.y = coordinates[index]
        return result
    }

    forEach(consumer: (x: number, y: number) => boolean | void, startIndex?: number, endIndexExclusive?: number) {
        const { coordinates } = this
        startIndex = (startIndex == null) ? 0 : (startIndex << 1)
        endIndexExclusive = (endIndexExclusive == null) ? coordinates.length : (endIndexExclusive << 1)
        while(startIndex < endIndexExclusive){
            const result = consumer(coordinates[startIndex++], coordinates[startIndex++])
            if (result === false){
                break
            }
        }
    }

    forEachObject(consumer: (result: PointBuilder) => boolean | void, startIndex?: number, endIndexExclusive?: number) {
        const result = { x: undefined, y: undefined }
        this.forEach((x, y) => {
            result.x = x
            result.y = y
            return consumer(result)
        })
    }
    
}