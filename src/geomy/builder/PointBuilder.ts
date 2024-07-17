import { forEachPointCoordinate } from "../coordinate"


export interface PointBuilder{
    x: number
    y: number
}


export type PointConsumer = (point: PointBuilder) => boolean | undefined 


export function copyToPoint(x: number, y: number, target: PointBuilder) {
    target.x = x
    target.y = y
}


export function forEachPoint(coordinates: ReadonlyArray<number>, consumer: PointConsumer, startIndexInclusive?: number, numberOfPoints?: number) {
    const point = { x: undefined, y: undefined }
    forEachPointCoordinate(coordinates, function(x: number, y: number): boolean | undefined {
        copyToPoint(x, y, point)
        if (consumer(point) === false) {
            return false
        }
    }, startIndexInclusive, numberOfPoints)
}
