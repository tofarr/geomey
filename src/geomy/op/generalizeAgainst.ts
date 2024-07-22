import { createBuilder } from "../builder/GeometryBuilderPathWalker";
import { Geometry } from "../geom/Geometry";
import { B_INSIDE_A, DISJOINT } from "../Relation";
import { Tolerance } from "../Tolerance";


export function generalizeAgainst(geometry: Geometry, generalizeTolerance: Tolerance, tolerance: Tolerance, asPolygon: boolean, ...others: Geometry[]) {
    let builder = createBuilder(tolerance, geometry, ...others)
    builder = builder.createGeneralized(generalizeTolerance)
    builder.cull((x, y) => {
        return geometry.relatePoint(x, y, generalizeTolerance) === DISJOINT
    })
    return builder.clearAndBuilderGeometry()
}
