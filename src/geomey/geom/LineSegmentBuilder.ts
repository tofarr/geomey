

export interface LineSegmentBuilder {
    ax: number
    ay: number
    bx: number
    by: number
}


export type LineSegmentCoordinatesConsumer = (ax: number, ay: number, bx: number, by: number) => undefined | boolean


export type LineSegmentConsumer = (lineSegment: LineSegmentBuilder) => undefined | boolean


export function copyToLineSegment(ax: number, ay: number, bx: number, by: number, target: LineSegmentBuilder) {
    target.ax = ax
    target.ay = ay
    target.bx = bx
    target.by = by
}


export function forEachLineSegmentCoordinates(coordinates: ReadonlyArray<number>, consumer: LineSegmentCoordinatesConsumer, fromIndexInclusive?: number, toIndexExclusive?: number): number {
    let index = (fromIndexInclusive || 0) * 2
    const { length } = coordinates
    toIndexExclusive = toIndexExclusive ? (toIndexExclusive * 2) :(length - 2)
    while(index < toIndexExclusive) {
        let n = index % length
        const ax = coordinates[n++]
        const ay = coordinates[n++]
        n %= length
        const bx = coordinates[n++]
        const by = coordinates[n]
        const result = consumer(ax, ay, bx, by)
        if (result === false) {
            return index
        }
        fromIndexInclusive += 2
    }
    return index
}


export function forEachLineSegment(coordinates: ReadonlyArray<number>, consumer: LineSegmentConsumer, fromIndexInclusive?: number, toIndexExclusive?: number): number {
    const lineSegment = { ax: undefined, ay: undefined, bx: undefined, by: undefined }
    return forEachLineSegmentCoordinates(coordinates, (ax, ay, bx, by) => {
        copyToLineSegment(ax, ay, bx, by, lineSegment)
        return consumer(lineSegment)
    }, fromIndexInclusive, toIndexExclusive)
}
