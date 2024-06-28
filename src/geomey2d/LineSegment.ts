import { Geom, GeomHandler } from "./Geom";
import { Ords, distanceSq, generalizeOrd, getBounds, matchCoords, matchOrds } from "./Ords";
import { Point, POINT_TYPE } from "./Point";

export const LINE_SEGMENT_TYPE = "LineSegment"


export interface LineSegment extends Geom {
    type: typeof LINE_SEGMENT_TYPE
    x1: number
    y1: number
    x2: number
    y2: number
    bounds?: Bounds
}


export function comparePoints(x1: number, y1: number, x2: number, y2: number): number {
    let s = x1 - x2
    if (!s) {
        s = y1 - y2
    }
    return s
}


export function distanceToLineSegmentSq(lx1: number, ly1: number, lx2: number, ly2: number, px: number, py: number, accuracy: number) {
    const dx = lx2 - lx1
    const dy = ly2 - ly1
    const lineLengthSquared = dx * dx + dy * dy
    
    if (lineLengthSquared <= accuracy) {
        return distanceSq(lx1, ly1, px, py)
    }

    const t = Math.max(0, Math.min(
        1, ((px - lx1) * dx + (py - ly1) * dy) / lineLengthSquared
    ));
    
    const closestX = lx1 + t * dx;
    const closestY = ly1 + t * dy;

    return distanceSq(px, py, closestX, closestY)
}


export const LineSegmentHandler: GeomHandler<LineSegment> = {
    type: LINE_SEGMENT_TYPE,
    copy: function(geom: LineSegment): LineSegment {
        const { x1, y1, x2, y2 } = geom
        return {
            type: LINE_SEGMENT_TYPE, x1, y1, x2, y2
        }
    },
    isValid: function(geom: LineSegment, accuracy: number) {
        const { x1, y1, x2, y2} = geom
        let valid = !(
            Number.isNaN(x1) ||
            Number.isNaN(y1) ||
            Number.isNaN(x2) ||
            Number.isNaN(y2)
        )
        valid &&= distanceSq(x1, y1, x2, y2) >= accuracy
        return valid
    },
    getBounds: function(geom: LineSegment): Bounds | null {
        let { bounds } = geom
        if (!bounds) {
            const { x1, y1, x2, y2} = geom
            bounds = {
                minX: Math.min(x1, x2),
                minY: Math.min(y1, y2),
                maxX: Math.max(x1, x2),
                maxY: Math.max(y1, y2)
            }
            geom.bounds = bounds
        }
        return bounds
    }, 
    normalize: function(geom: LineSegment): LineSegment {
        let { x1, y1, x2, y2 } = geom
        const compare = comparePoints(x1, y1, x2, y2)
        if (compare > 0) {
            let tmp = x1
            x1 = x2
            x2 = tmp
            tmp = y1
        }
        return { type: LINE_SEGMENT_TYPE, x1, x2, y1, y2 }
    },
    generalize: function(geom: LineSegment, accuracy: number): LineSegment | Point {
        const { minX, minY, maxX, maxY } = this.getBounds(geom)
        if (matchOrds(minX, maxX, accuracy) && matchOrds(minY, maxX, accuracy)) {
            return {
                type: POINT_TYPE,
                x: generalizeOrd((maxX + minX) / 2, accuracy),
                y: generalizeOrd((maxY + minY) / 2, accuracy)
            }
        }
        return this.normalize(geom)
    }
}
