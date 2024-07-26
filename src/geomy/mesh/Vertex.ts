
const TWO_PI = 2 * Math.PI


export class Vertex {
    readonly x: number
    readonly y: number
    readonly zOrder: BigInt
    readonly links: ReadonlyArray<Vertex>

    constructor(x: number, y: number, zOrder: BigInt, links?: Vertex[], ring?: boolean) {
        this.x = x
        this.y = y
        this.zOrder = zOrder
        this.links = links || []
    }
}
