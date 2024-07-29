import { createMeshes } from "../../mesh/MeshPathWalker";
import { generalize } from "../../mesh/op/generalize";
import { DISJOINT } from "../../Relation";
import { Tolerance } from "../../Tolerance";
import { createMultiGeometry, Geometry } from "../";

export function generalizeAgainst(
  geometry: Geometry,
  generalizeTolerance: Tolerance,
  tolerance: Tolerance,
  ...others: Geometry[]
): Geometry {
  const meshes = createMeshes(tolerance, geometry, ...others);
  for (const mesh of meshes) {
    generalize(mesh, generalizeTolerance);
    mesh.cull((x, y) => {
      return geometry.relatePoint(x, y, generalizeTolerance) === DISJOINT;
    });
  }
  return createMultiGeometry(...meshes).simplify();
}
