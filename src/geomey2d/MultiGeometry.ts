import { Geom, GeomHandler, getHandlerForType } from "./Geom"
import { generalizeOrd } from "./Ords"
import { cloneDeep } from "lodash"

export const MULTI_GEOMETRY_TYPE = "MultiGeometry"


export interface MultiGeometry extends Geom {
    type: typeof MULTI_GEOMETRY_TYPE
    geoms: Geom[]
    bounds?: Bounds
}


export const MultiGeometryHandler: GeomHandler<MultiGeometry> = {
    type: MULTI_GEOMETRY_TYPE,
    copy: function(geom: MultiGeometry): MultiGeometry {
        return { type: MULTI_GEOMETRY_TYPE, geoms: geom.geoms.map(g => getHandlerForType(g.type).copy(g)) }
    },
    isValid: function(geom: MultiGeometry, accuracy: number) {
        return !geom.geoms.map(g => !getHandlerForType(g.type).isValid(g, accuracy))
    },
    getBounds: function(geom: MultiGeometry): Bounds | null {
        let { bounds } = geom
        if (bounds) {
            return bounds
        }
        bounds = geom.bounds = geom.geoms.reduce((bounds, geom) => {
            const newBounds = getHandlerForType(geom.type).getBounds(geom)
            if (newBounds){
                
            }
            return bounds
        }, null)
        return bounds
    }, 
    normalize: function(geom: Point): Point {
        return this.copy(geom)
    },
    generalize: function(geom: Point, accuracy: number): Point {
        return { 
            type: POINT_TYPE,
            x: generalizeOrd(geom.x, accuracy),
            y: generalizeOrd(geom.y, accuracy) 
        }
    }
}

