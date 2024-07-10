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
        douglasPeucker(ords, 0, ords.length-2, accuracy, generalized)
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


function douglasPeucker(ords: number[], startIndex: number, endIndex: number, accuracy: number, result: number[]) {
    if (endIndex - startIndex < 4) {
        while(startIndex < endIndex){
            result.push(ords[startIndex++], ords[startIndex++])
        }
        return
    }
    let maxIndex = startIndex
    let maxDist = 0
    const lineStartX = ords[startIndex++]
    const lineStartY = ords[startIndex++]
    const lineEndX = ords[endIndex]
    const lineEndY = ords[endIndex+1]
    while(startIndex < endIndex) {
        const index = startIndex
        const dist = getPerpendicularDistance(ords[startIndex++], ords[startIndex++], lineStartX, lineStartY, lineEndX, lineEndY)
        if(dist > maxDist) {
            maxDist = dist
            maxIndex = index
        }
    }
    result.push(lineStartX, lineStartY)
    if (maxDist <= accuracy){
        return
    }
    douglasPeucker(ords, startIndex, maxIndex, accuracy, result)
    douglasPeucker(ords, maxIndex, endIndex, accuracy, result)
}


function getPerpendicularDistance(pointX: number, pointY: number, lineStartX: number, lineStartY: number, lineEndX: number, lineEndY: number): number {
    const area = Math.abs(0.5 * (lineStartX * lineEndY + lineEndX * pointY + pointX * lineStartY - lineEndX * lineStartY - pointX * lineEndY - lineStartX * pointY));
    const bottom = Math.hypot(lineStartX - lineEndX, lineStartY - lineEndY);
    const height = area / bottom * 2;
    return height;
}
