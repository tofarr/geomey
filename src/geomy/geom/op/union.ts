import { createBuilder } from "../builder/GeometryBuilderPathWalker";
import { Geometry } from "../geom/Geometry";
import { B_INSIDE_A } from "../Relation";
import { Tolerance } from "../Tolerance";


export function union(a: Geometry, b: Geometry, tolerance: Tolerance): Geometry {
    const builder = createBuilder(tolerance, a, b)
    builder.cull((x, y) => {
        return !!(
            (a.relatePoint(x, y, tolerance) | B_INSIDE_A) ||
            (b.relatePoint(x, y, tolerance) | B_INSIDE_A)
        )
    })
    return builder.clearAndBuilderGeometry()
}
