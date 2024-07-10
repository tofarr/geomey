import { Point } from "./Point"

enum Relation {
    DISJOINT,
    TOUCH,
    CONTAINS
}

export interface Geom {
    type: string
}

export interface GeomHandler<G extends Geom> {
    type: string
    copy: (geom: G) => G
    isValid: (geom: G, accuracy: number) => boolean
    getBounds: (geom: G) => Bounds | null
    normalize: (geom: G) => Geom
    generalize: (geom: G, accuracy: number) => Geom
    transform: (geom: G, transformer: (point: Point) => void) => Geom
    relatePoint: (geom: G, point: Point, accuracy: number) => Relation
    
    union: (geom: G, other: Geom, accuracy: number) => Geom
    intersection: (geom: G, other: Geom, accuracy: number) => Geom
    less: (geom: G, other: Geom, accuracy: number) => Geom
    toGeometryCollection: (geom: G) => GeometryCollection
    toWkt: (geom: G, result: string[])
}


const handlers: GeomHandler<Geom>[] = []


export function getHandlerForType(type: string): GeomHandler<Geom> {
    return handlers.find(h => h.type == type)
}
