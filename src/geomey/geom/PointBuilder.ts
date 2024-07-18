import { forEachCoordinate } from "../coordinate"


export interface PointBuilder{
    x: number
    y: number
}


export function copyToPoint(x: number, y: number, target: PointBuilder): PointBuilder {
    target.x = x
    target.y = y
    return target
}


export type PointConsumer = (point: PointBuilder, index: number) => boolean | void


export function forEachPoint(coordinates: ReadonlyArray<number>, consumer: PointConsumer, fromIndexInclusive?: number, toIndexExclusive?: number){
    const point = { x: undefined, y: undefined }
    fromIndexInclusive ||= 0
    return forEachCoordinate(coordinates, (x, y) => {
        copyToPoint(x, y, point)
        return consumer(point, fromIndexInclusive++)
    }), fromIndexInclusive, toIndexExclusive
}
