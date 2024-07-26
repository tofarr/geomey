import { Mesh } from "../Mesh";
import { Vertex } from "../Vertex";



export function removeNonRingVertices(mesh: Mesh) {
    const toRemove = getNonRingEndpoints(mesh)
    while(toRemove.length){
        const vertex = toRemove.pop()
        for (const linked of vertex.links){
            if (linked.links.length <= 2){
                toRemove.push(linked)
            }
        }
        mesh.removeVertex(vertex.x, vertex.y)
    }
}


export function getNonRingEndpoints(mesh: Mesh): Vertex[] {
    const endpoints = []
    mesh.forEachVertex((vertex) => {
        if (vertex.links.length < 2){
            endpoints.push(vertex)
        }
    })
    return endpoints
}
