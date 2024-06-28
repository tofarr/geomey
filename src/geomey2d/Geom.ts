
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
}
