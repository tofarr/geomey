import { createBuilder } from "../builder/GeometryBuilderPathWalker";
import { Geometry } from "../geom/Geometry";
import { B_INSIDE_A } from "../Relation";
import { Tolerance } from "../Tolerance";


export function less(a: Geometry, b: Geometry, tolerance: Tolerance): Geometry {
    const builder = createBuilder(tolerance, a, b)
    builder.cull((x, y) => {
        const relateB = b.relatePoint(x, y, tolerance)
        return !!(relateB | B_INSIDE_A)
    })
    return builder.clearAndBuilderGeometry()
}
