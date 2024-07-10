

export interface PointBuilder{
    x: number
    y: number
}

export function copyToPoint(x: number, y: number, point: PointBuilder) {
    point.x = x
    point.y = y
}