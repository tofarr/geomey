
export interface Geom {
    type: string
}

export interface GeomHandler<G extends Geom> {
    type: string
    copy: (geom: G) => G
    isValid: (geom: G) => boolean
    getBounds: (geom: G) => Bounds | null
    normalize: (geom: G) => G
    generalize: (geom: G, accuracy: number) => G
}
