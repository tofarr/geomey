import { GeometryBuilder } from "../builder/GeometryBuilder";


export function cull(builder: GeometryBuilder, match: (x: number, y: number) => boolean) {
    cullLinks(builder, match)
    cullVertices(builder, match)
}


export function cullLinks(builder: GeometryBuilder, match: (x: number, y: number) => boolean) {
    const toRemove = []
    builder.forEachLink(({a, b}) => {
        const { x: ax, y: ay} = a
        const { x: bx, y: by} = b
        const x = (ax + bx) / 2
        const y = (ay + by) / 2
        if (match(x, y)){
            toRemove.push(ax, ay, bx, by)
        }
    })
    const { length } = toRemove
    let i = 0
    while (i < length) {
        builder.removeLink(toRemove[i++], toRemove[i++], toRemove[i++], toRemove[i++])
    }
}


export function cullVertices(builder: GeometryBuilder, match: (x: number, y: number) => boolean) {
    const toRemove = []
    builder.forEachVertex(({x, y}) => {
        if (match(x, y)){
            toRemove.push(x, y)
        }
    })
    const { length } = toRemove
    let i = 0
    while (i < length) {
        builder.removeVertex(toRemove[i++], toRemove[i++])
    }
}
