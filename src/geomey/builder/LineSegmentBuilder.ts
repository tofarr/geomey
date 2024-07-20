
export interface LineSegmentBuilder {
    ax: number
    ay: number
    bx: number
    by: number
}

export function copyToLineSegment(ax: number, ay: number, bx: number, by: number, target: LineSegmentBuilder) {
    target.ax = ax
    target.ay = ay
    target.bx = bx
    target.by = by
}
