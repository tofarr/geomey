import { Mesh } from "../Mesh";
import { Vertex } from "../Vertex";

/**
 * Pop a linear ring off the mesh. Assumes that the mesh contains only linear rings.
 */
export function popLinearRing(mesh: Mesh): number[] | null {
    const origin = mesh.getOrigin()
    if (origin == null){
        return null
    }
    let a = origin
    let b = nextAnticlockwiseVertexFrom(origin, origin.x, origin.y - 1)
    if (b == null){
        return null
    }
    let remove = true
    const result = [a.x, a.y]
    while (b != origin) {
        result.push(b.x, b.y)
        const c = nextClockwiseVertexFrom(b, a.x, a.y)
        if(remove){
            mesh.removeLink(a.x, a.y, b.x, b.y)
        }
        if(c.links.length > 2){
            remove = !remove
        }
        a = b
        b = c
    }
    return result
}


export function nextAnticlockwiseVertexFrom(origin: Vertex, x: number, y: number) {
    const baseAngle = Math.atan2(y - origin.y, x - origin.x)
    let minAngle = Infinity
    let minLink = undefined
    for (const link of origin.links) {
        let linkAngle = Math.atan2(link.y - this.y, link.x - this.x) - baseAngle
        if(linkAngle < 0){
            linkAngle += Math.PI
        }
        if (linkAngle < minAngle){
            minAngle = linkAngle
            minLink = link
        }
    }
    return minLink
}


export function nextClockwiseVertexFrom(origin: Vertex, x: number, y: number) {
    const baseAngle = Math.atan2(y - origin.y, x - origin.x)
    let minAngle = Infinity
    let minLink = undefined
    for (const link of origin.links) {
        let linkAngle = Math.atan2(link.y - this.y, link.x - this.x) - baseAngle
        if(linkAngle < 0){
            linkAngle += Math.PI
        }
        if (linkAngle > minAngle){
            minAngle = linkAngle
            minLink = link
        }
    }
    return minLink
}