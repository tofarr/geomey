
const TWO_PI = 2 * Math.PI


export class Vertex {
    readonly x: number
    readonly y: number
    readonly zOrder: number
    readonly links: ReadonlyArray<Vertex>

    constructor(x: number, y: number, zOrder: number, links?: Vertex[], ring?: boolean) {
        this.x = x
        this.y = y
        this.zOrder = zOrder
        this.links = links || []
    }

    nextAnticlockwiseVertexFrom(vertex: Vertex) {
        var baseAngle = Math.atan2(vertex.y - this.y, vertex.x - this.x) + TWO_PI;
        let minAngle = Infinity
        let minLink = undefined
        for (const link of this.links) {
            let linkAngle = Math.atan2(link.y - this.y, link.x - this.x) + TWO_PI - baseAngle;
            if (linkAngle > TWO_PI){
                linkAngle -= TWO_PI
            }
            if (linkAngle < minAngle){
                minAngle = linkAngle
                minLink = link
            }
        }
        return minLink
    }
}
