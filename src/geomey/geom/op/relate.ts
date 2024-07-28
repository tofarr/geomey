import { createMeshes } from "../../mesh/MeshPathWalker";
import { popLinearRing } from "../../mesh/op/popLinearRing";
import {
  A_INSIDE_B,
  ALL,
  B_INSIDE_A,
  B_OUTSIDE_A,
  DISJOINT,
  flipAB,
  Relation,
  UNKNOWN,
} from "../../Relation";
import { Tolerance } from "../../Tolerance";
import { Geometry } from "../Geometry";

/**
 * A general algorithm for relating geometries. This may be far more resource intensive than type specific versions
 */
export function relate(
  a: Geometry,
  b: Geometry,
  tolerance: Tolerance,
): Relation {
  if (a.getBounds().relate(b.getBounds(), tolerance) === DISJOINT) {
    return DISJOINT;
  }
  let result = UNKNOWN;
  const meshes = createMeshes(tolerance, a, b);
  for (const mesh of meshes) {
    mesh.forEachVertex(({ x, y }) => {
      result |= relatePoint(x, y, a, b, tolerance);
      return !!(result & ALL);
    });
    mesh.forEachLink((link) => {
      const { x: ax, y: ay } = link.a;
      const { x: bx, y: by } = link.b;
      result |= relateLineSegment(ax, ay, bx, by, a, b, tolerance);
      return !!(result & ALL);
    });
  }

  const [rings] = meshes;
  rings.cull((x, y) => {
    return !!(
      a.relatePoint(x, y, tolerance) | B_OUTSIDE_A ||
      b.relatePoint(x, y, tolerance) | B_OUTSIDE_A
    );
  });
  const ring = popLinearRing(rings);
  if (ring != null) {
    result |= A_INSIDE_B | B_INSIDE_A;
  }
  return result;
}

function relatePoint(
  x: number,
  y: number,
  a: Geometry,
  b: Geometry,
  tolerance: Tolerance,
): Relation {
  const relationA = a.relatePoint(x, y, tolerance);
  const relationB = b.relatePoint(x, y, tolerance);
  return (relationA | flipAB(relationB)) as Relation;
}

function relateLineSegment(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  a: Geometry,
  b: Geometry,
  tolerance: Tolerance,
): Relation {
  return relatePoint((ax + bx) / 2, (ay + by) / 2, a, b, tolerance);
}
