import { PointBuilder } from "../geom/PointBuilder";


export interface CoordinateCursor {
    nextCoordinate(result: PointBuilder) : boolean
}