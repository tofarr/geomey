import { Geom, GeomHandler } from "./Geom"
import { generalizeOrd } from "./Ords"

export const TYPE = "Point"


export interface Point extends Geom {
    type: typeof TYPE
    x: number
    y: number
    bounds?: Bounds
}


export const PointHandler: GeomHandler<Point> = {
    type: TYPE,
    copy: function(geom: Point): Point {
        return { type: TYPE, x: geom.x, y: geom.y }
    },
    isValid: function(geom: Point) {
        return !(Number.isNaN(geom.x) || Number.isNaN(geom.y))
    },
    getBounds: function(geom: Point): Bounds | null {
        let { bounds } = geom
        if (!bounds) {
            bounds = {
                minX: geom.x,
                minY: geom.y,
                maxX: geom.x,
                maxY: geom.y
            }
            geom.bounds = bounds
        }
        return bounds
    }, 
    normalize: function(geom: Point): Point {
        return this.copy(geom)
    },
    generalize: function(geom: Point, accuracy: number): Point {
        return { 
            type: TYPE,
            x: generalizeOrd(geom.x, accuracy),
            y: generalizeOrd(geom.y, accuracy) 
        }
    }
}

