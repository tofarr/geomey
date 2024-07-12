

export function normalizeValue(value: number, tolerance: number): number{
    return Math.round(value / tolerance) * tolerance
}