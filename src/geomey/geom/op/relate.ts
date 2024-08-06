import { createMeshes } from "../../mesh/MeshPathWalker";
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
import { Geometry } from "../";

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
    mesh.forEachVertexAndLinkCentroid((x, y) => {
      result |= relatePoint(x, y, a, b, tolerance);
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
  rings.forEachLinearRing(() => {
    result |= A_INSIDE_B | B_INSIDE_A;
    return false;
  });
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
