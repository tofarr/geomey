
export function match(a: number, b: number, tolerance: number): boolean {
    return Math.abs(a - b) <= tolerance
}

export function normalize(value: number, tolerance: number): number{
    return Math.round(value / tolerance) * tolerance
}