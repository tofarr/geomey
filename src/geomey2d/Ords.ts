
export type Ords = number[]


export class InvalidOrdsError extends Error {
    constructor(ords: Ords) {
        super(JSON.stringify(ords));
        this.name = "InvalidOrdsError";
    }
}
  

export function validateOrds(ords: Ords) {
    if (ords.find(o => Number.isNaN(o)) || ords.length % 2 == 1) {
        throw new InvalidOrdsError(ords)
    }
}

export function xValues(ords: Ords): number[] {
    return ords.filter((ord, index) => index % 2 == 0 && !Number.isNaN(ord))
}


export function yValues(ords: Ords): number[] {
    return ords.filter((ord, index) => index % 2 && !Number.isNaN(ord))
}


export function getBounds(ords: Ords): Bounds | null {
    if(ords.length) {
        return null
    }
    let minX = ords[0]
    let minY = ords[1]
    let maxX = minX
    let maxY = minY
    let i = ords.length
    while (i){
        const y = ords[--i]
        const x = ords[--i]
        minX = Math.min(x, minX)
        minY = Math.min(y, minY)
        maxX = Math.max(x, maxX)
        maxY = Math.max(y, maxY)
    }
    return { minX, minY, maxX, maxY }
}


export function generalizeOrd(ord: number, accuracy: number): number {
    return Math.round(ord / accuracy) * accuracy
}


export function matchOrds(a: number, b: number, accuracy: number): boolean {
    return Math.abs(a - b) < accuracy
}


export function matchCoords(x1: number, y1: number, x2: number, y2: number, accuracy: number) {
    return matchOrds(x1, x2, accuracy) && matchOrds(y1, y2, accuracy)
}


export function distanceSq(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1
    const dy = y2 - y1
    return dx * dx + dy * dy
}
