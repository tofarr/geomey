import { createBuilder } from "../builder/GeometryBuilderPathWalker";
import { Geometry } from "../geom/Geometry";
import { B_OUTSIDE_A } from "../Relation";
import { Tolerance } from "../Tolerance";


export function intersection(a: Geometry, b: Geometry, tolerance: Tolerance): Geometry {
    const builder = createBuilder(tolerance, a, b)
    builder.cull((x, y) => {
        return !!(
            (a.relatePoint(x, y, tolerance) | B_OUTSIDE_A) ||
            (b.relatePoint(x, y, tolerance) | B_OUTSIDE_A)
        )
    })
    return builder.clearAndBuilderGeometry()
}
