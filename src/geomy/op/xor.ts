import { createBuilder } from "../builder/GeometryBuilderPathWalker";
import { Geometry } from "../geom/Geometry";
import { Tolerance } from "../Tolerance";


export function xor(a: Geometry, b: Geometry, tolerance: Tolerance): Geometry {
    const builder = createBuilder(tolerance, a, b)
    return builder.clearAndBuilderGeometry()
}
