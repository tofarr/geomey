import { PointBuilder } from "../geom/PointBuilder";
import { ArrayCoordinateStore } from "./ArrayCoordinateStore";
import { CoordinateStore } from "./CoordinateStore";
import { WritableCoordinateStore } from "./WritableCoordinateStore";


export class WritableArrayCoordinateStore extends ArrayCoordinateStore implements WritableCoordinateStore {
    
    constructor(coordinates: number[]){
        super(coordinates)
    }

    append(coordinate: PointBuilder): WritableCoordinateStore {
        this.coordinates.push(coordinate.x, coordinate.y)
        return this
    }

    set(index: number, coordinate: PointBuilder): WritableCoordinateStore {
        const { coordinates } = this
        index << 1
        coordinates[index++] = coordinate.x
        coordinates[index] = coordinate.y
        return this
    }

    appendAll(store: CoordinateStore): WritableCoordinateStore {
        store.forEach((x, y) => { this.coordinates.push(x, y) })
        return this
    }
}