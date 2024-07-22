import { createBuilder } from "../../builder/GeometryBuilderPathWalker";
import { DISJOINT, flipAB, Relation, UNKNOWN } from "../../Relation";
import { Tolerance } from "../../Tolerance";
import { Geometry } from "../Geometry";
import { LinearRing } from "../LinearRing";


/**
 * A general algorithm for relating geometries. This may be far more resource intensive than type specific versions
 */
export function relate(a: Geometry, b: Geometry, tolerance: Tolerance): Relation {
    if (a.getBounds().relate(b.getBounds(), tolerance) === DISJOINT) {
        return DISJOINT
    }
    let result = UNKNOWN
    const builder = createBuilder(tolerance, a, b)
    builder.forEachVertex(({x, y}) => {
        result |= relatePoint(x, y, a, b, tolerance)
    })
    builder.forEachLink((link) => {
        const { x: ax, y: ay } = link.a
        const { x: bx, y: by } = link.b
        result |= relateLineSegment(ax, ay, bx, by, a, b, tolerance)
    })

    THIS IS WRONG!!! THIS WILL ONLY WORK IF THESE RINGS DO NOT OVERLAP.
    HOW DO WE BUILD SUCH A CONSTRUCT?
    MAYBE THIS STILL HAS TO COME FROM THE GEOMETRY?
    MAYBE WE ACTUALLY SHOULD BUILD A TRISTRIP CLASS
    builder.forEachRing((linearRing) => {
        result |= relateLinearRing(linearRing, a, b, tolerance)
    })
    return result
}


function relatePoint(x: number, y: number, a: Geometry, b: Geometry, tolerance: Tolerance): Relation {
    const relationA = a.relatePoint(x, y, tolerance)
    const relationB = b.relatePoint(x, y, tolerance)
    return (relationA | flipAB(relationB)) as Relation
}


function relateLineSegment(ax: number, ay: number, bx: number, by: number, a: Geometry, b: Geometry, tolerance: Tolerance): Relation {
    return relatePoint((ax + bx) / 2, (ay + by) / 2, a, b, tolerance)
}


function relateLinearRing(ring: LinearRing, a: Geometry, b: Geometry, tolerance: Tolerance): Relation {
    let result = UNKNOWN
    for (ring of ring.getConvexRings()) {
        const { x, y } = ring.getCentroid()
        result |= relatePoint(x, y, a, b, tolerance)
    }
    return result
}
