import { PointBuilder } from "../geom/PointBuilder";
import { CoordinateStore } from "./CoordinateStore";
import { WritableArrayCoordinateStore } from "./WritableArrayCoordinateStore";


export interface WritableCoordinateStore extends CoordinateStore {
    append(coordinate: PointBuilder): Promise<WritableCoordinateStore>
    set(index: number, coordinate: PointBuilder): Promise<WritableCoordinateStore>
    appendAll(store: CoordinateStore): Promise<WritableCoordinateStore>
}


export async function newWritableStore(initialCapacity: number): Promise<WritableCoordinateStore> {
    const result = new WritableArrayCoordinateStore(new Array(initialCapacity << 1))
    return result
}