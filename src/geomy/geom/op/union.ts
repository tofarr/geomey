import { createMeshes } from "../../mesh/MeshPathWalker";
import { B_INSIDE_A } from "../../Relation";
import { Tolerance } from "../../Tolerance";
import { Geometry } from "../Geometry";
import { createMultiGeometry } from "./createMultiGeometry";


export function union(a: Geometry, b: Geometry, tolerance: Tolerance): Geometry {
    const [ rings, linesAndPoints ] = createMeshes(tolerance, a, b)
    rings.cullLinks((x, y) => {
        return !!(
            (a.relatePoint(x, y, tolerance) | B_INSIDE_A) ||
            (b.relatePoint(x, y, tolerance) | B_INSIDE_A)
        )
    })
    return createMultiGeometry(rings, linesAndPoints).simplify()
}
