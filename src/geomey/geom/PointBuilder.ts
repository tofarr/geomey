

export interface PointBuilder{
    x: number
    y: number
}

export function copyToPoint(x: number, y: number, target: PointBuilder) {
    target.x = x
    target.y = y
}