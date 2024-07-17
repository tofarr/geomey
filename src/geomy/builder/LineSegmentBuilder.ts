import { forEachLineSegmentCoordinates } from "../coordinate"


export interface LineSegmentBuilder {
    ax: number
    ay: number
    bx: number
    by: number
}


export type LineSegmentConsumer = (lineSegment: LineSegmentBuilder) => boolean | undefined 


export function copyToLineSegment(ax: number, ay: number, bx: number, by: number, target: LineSegmentBuilder) {
    target.ax = ax
    target.ay = ay
    target.bx = bx
    target.by = by
}


export function forEachLineSegment(coordinates: ReadonlyArray<number>, consumer: LineSegmentConsumer, startIndexInclusive?: number, numberOfLineSegments?: number) {
    const lineSegment = { ax: undefined, ay: undefined, bx: undefined, by: undefined }
    forEachLineSegmentCoordinates(coordinates, function(ax: number, ay: number, bx: number, by: number): boolean | undefined {
        copyToLineSegment(ax, ay, bx, by, lineSegment)
        if (consumer(lineSegment) === false) {
            return false
        }
    }, startIndexInclusive, numberOfLineSegments)
}
