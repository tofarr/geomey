import { PointBuilder } from "../geom/PointBuilder";
import { CoordinateStore } from "./CoordinateStore";
import { WritableArrayCoordinateStore } from "./WritableArrayCoordinateStore";


export interface WritableCoordinateStore extends CoordinateStore {
    append(coordinate: PointBuilder): WritableCoordinateStore
    set(index: number, coordinate: PointBuilder): WritableCoordinateStore
    appendAll(store: CoordinateStore): WritableCoordinateStore
    
}

export function newInstance(store: CoordinateStore) {
    const result = new WritableArrayCoordinateStore(new Array(store.size() * 2))
    result.appendAll(store)
    return result
}