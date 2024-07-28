import { createMeshes } from "../../mesh/MeshPathWalker";
import { addExplicitPointsOfIntersection } from "../../mesh/op/addExplicitPointsOfIntersection";
import { B_OUTSIDE_A } from "../../Relation";
import { Tolerance } from "../../Tolerance";
import { Geometry } from "../Geometry";
import { createMultiGeometry } from "../MultiGeometry";

export function intersection(
  a: Geometry,
  b: Geometry,
  tolerance: Tolerance,
): Geometry {
  const meshes = createMeshes(tolerance, a, b);
  const [rings, linesAndPoints] = meshes;
  addExplicitPointsOfIntersection(rings, linesAndPoints);
  for (const mesh of meshes) {
    mesh.cull((x, y) => {
      return !!(
        a.relatePoint(x, y, tolerance) | B_OUTSIDE_A ||
        b.relatePoint(x, y, tolerance) | B_OUTSIDE_A
      );
    });
  }
  return createMultiGeometry(rings, linesAndPoints).simplify();
}
