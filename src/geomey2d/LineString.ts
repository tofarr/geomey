import { Geom, GeomHandler } from "./Geom";
import { LINE_SEGMENT_TYPE, LineSegment, LineSegmentHandler, distanceToLineSegmentSq } from "./LineSegment";
import { Ords, distanceSq, generalizeOrd, getBounds, matchCoords, matchOrds } from "./Ords";
import { Point, POINT_TYPE } from "./Point";

export const LINE_STRING_TYPE = "LineString"


export interface LineString extends Geom {
    type: typeof LINE_STRING_TYPE
    ords: Ords
    bounds?: Bounds
}


export const LineStringHandler: GeomHandler<LineString> = {
    type: LINE_STRING_TYPE,
    copy: function(geom: LineString): LineString {
        return {
            type: LINE_STRING_TYPE,
            ords: geom.ords.slice()
        }
    },
    isValid: function(geom: LineString, accuracy: number) {
        const { ords } = geom
        if (ords.length < 4 || ords.length % 2 !== 0 || ords.find(n => Number.isNaN(n))) {
            return false
        }
        const accuracySq = accuracy * accuracy
        const last = ords.length - 2
        let i = 2;
        while (i < last) {
            const x1 = ords[i++]
            const y1 = ords[i++]
            const x2 = ords[i]
            const y2 = ords[i+1]
            if (distanceSq(x1, y1, x2, y2) < accuracySq) {
                return false
            }
        }
        return true
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
        return { type: LINE_STRING_TYPE, ords: [ ...geom.ords ] }
    },
    generalize: function(geom: LineString, accuracy: number): LineString | LineSegment | Point {
        const { minX, minY, maxX, maxY } = this.getBounds(geom)
        if (matchOrds(minX, maxX, accuracy) && matchOrds(minY, maxX, accuracy)) {
            return {
                type: POINT_TYPE,
                x: generalizeOrd((maxX + minX) / 2, accuracy),
                y: generalizeOrd((maxY + minY) / 2, accuracy)
            }
        }
        const { ords } = geom
        const generalized = []
        const last = ords.length - 4
        let i = 0
        while (i < ords.length) {
            const x1 = ords[i++]
            const y1 = ords[i++]
            while (i < last) {
                const x2 = ords[i+1]
                const y2 = ords[i+2]
                const x3 = ords[i+3]
                const y3 = ords[i+4]
                if(distanceToLineSegmentSq(x1, y1, x3, y3, x2, y2, accuracy) > accuracy) {
                    break
                }
                i += 2
            }
            generalized.push(x1, y1)
        }
        generalized.push(ords[ords.length-2], ords[ords.length-1])
        if (generalized.length == 4) {
            return LineSegmentHandler.normalize({
                type: LINE_SEGMENT_TYPE,
                x1: ords[0],
                y1: ords[1],
                x2: ords[2],
                y2: ords[3]
            }) as LineSegment
        }
        return {
            type: LINE_STRING_TYPE,
            ords: generalized
        }
    }
}
