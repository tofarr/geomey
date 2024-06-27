import { Geom, GeomHandler } from "./Geom";
import { Ords, getBounds, matchCoords } from "./Ords";

export const TYPE = "LineString"


export interface LineString extends Geom {
    type: typeof TYPE
    ords: Ords
    bounds?: Bounds
}


export const LineStringHandler: GeomHandler<LineString> = {
    type: TYPE,
    isValid: function(geom: LineString) {
        const { ords } = geom
        const valid = (
            (ords.length & 2) === 0 &&
            !ords.find(n => Number.isNaN(n))
        )
        return valid
    },
    getBounds: function(geom: LineString): Bounds | null {
        let { bounds } = geom
        if (!bounds) {
            bounds = getBounds(geom.ords)
            geom.bounds = bounds
        }
        return bounds
    }, 
    normalize: function(geom: LineString): LineString {
        return { type: TYPE, ords: [ ...geom.ords ] }
    },
    generalize: function(geom: LineString, accuracy: number): LineString {
        const { ords } = geom
        const generalized = []
        
        
        geom = this.normalize(geom)
        const { ords } = geom
        for (let i = 0; i < ords.length; i++) {
            let n = ords[i]
            ords[i] = Math.round(n / accuracy) * accuracy
        }
        const clustered: Ords = []
        let i = 0
        while (i < ords.length) {
            const x1 = ords[i++]
            const y1 = ords[i++]
            let j = 0
            while (j < ords.length) {
                const x2 = ords[++j]
                const y2 = ords[++j]
                if (matchCoords(x1, y1, x2, y2, accuracy)) {
                    i = j
                } else {
                    break
                }
            }
            clustered.push(x1, y1)
        }
        geom.ords = clustered
        return geom
    }
}
