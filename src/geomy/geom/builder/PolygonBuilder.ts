import { LinearRing } from "../geom/LinearRing"


export interface PolygonBuilder {
    shell: LinearRing
    holes: PolygonBuilder[]
}

