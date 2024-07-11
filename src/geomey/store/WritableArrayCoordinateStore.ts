import { PointBuilder } from "../geom/PointBuilder";
import { ArrayCoordinateStore } from "./ArrayCoordinateStore";
import { CoordinateStore } from "./CoordinateStore";
import { WritableCoordinateStore } from "./WritableCoordinateStore";


export class WritableArrayCoordinateStore extends ArrayCoordinateStore implements WritableCoordinateStore {
    
    constructor(coordinates: number[]){
        super(coordinates)
    }

    async append(coordinate: PointBuilder): Promise<WritableCoordinateStore> {
        this.coordinates.push(coordinate.x, coordinate.y)
        return this
    }

    async set(index: number, coordinate: PointBuilder): Promise<WritableCoordinateStore> {
        const { coordinates } = this
        index << 1
        coordinates[index++] = coordinate.x
        coordinates[index] = coordinate.y
        return this
    }

    async appendAll(store: CoordinateStore): Promise<WritableCoordinateStore> {
        store.forEach((x, y) => { this.coordinates.push(x, y) })
        return this
    }
}