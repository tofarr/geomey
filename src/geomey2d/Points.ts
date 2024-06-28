import { Geom, GeomHandler } from "./Geom";
import { comparePoints } from "./LineSegment";
import { Ords, generalizeOrd, getBounds, matchCoords, matchOrds } from "./Ords";
import { Point, POINT_TYPE } from "./Point";

export const TYPE = "Points"


export interface Points extends Geom {
    type: typeof TYPE
    ords: Ords
    bounds?: Bounds
}


export const PointsHandler: GeomHandler<Points> = {
    type: TYPE,
    copy: function(geom: Points): Points {
        return { type: TYPE, ords: geom.ords.slice() }
    },
    isValid: function(geom: Points) {
        const { ords } = geom
        let valid = (ords.length & 2) === 0
        valid &&= !ords.find(n => Number.isNaN(n))
        return valid
    },
    getBounds: function(geom: Points): Bounds | null {
        let { bounds } = geom
        if (!bounds) {
            bounds = getBounds(geom.ords)
            geom.bounds = bounds
        }
        return bounds
    }, 
    normalize: function(geom: Points): Points | Point {
        const { ords } = geom
        if (ords.length == 1) {
            return {
                type: POINT_TYPE,
                x: ords[0],
                y: ords[1]
            }
        }
        const coords = []
        let i = 0
        while (i < ords.length) {
            coords.push([ords[i++], ords[i++]])
        }
        coords.sort((a, b) => {
            return comparePoints(a[0], a[1], b[0], b[1])
        })
        const result: Points = {
            type: TYPE,
            ords: coords.flat() as number[]
        }
        return result
    },
    generalize: function(geom: Points, accuracy: number): Points | Point {
        const { minX, minY, maxX, maxY } = this.getBounds(geom)
        if (matchOrds(minX, maxX, accuracy) && matchOrds(minY, maxX, accuracy)) {
            return {
                type: POINT_TYPE,
                x: generalizeOrd((maxX + minX) / 2, accuracy),
                y: generalizeOrd((maxY + minY) / 2, accuracy)
            }
        }
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
