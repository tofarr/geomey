import { createMeshes } from "../../mesh/MeshPathWalker";
import { addExplicitPointsOfIntersection } from "../../mesh/op/addExplicitPointsOfIntersection";
import { B_INSIDE_A, DISJOINT } from "../../Relation";
import { Tolerance } from "../../Tolerance";
import { Geometry } from "../Geometry";
import { createMultiGeometry } from "../MultiGeometry";

export function less(a: Geometry, b: Geometry, tolerance: Tolerance): Geometry {
  const meshes = createMeshes(tolerance, a, b);
  const [rings, linesAndPoints] = meshes;
  addExplicitPointsOfIntersection(rings, linesAndPoints);
  rings.cull((x, y) => {
    return !!(b.relatePoint(x, y, tolerance) | B_INSIDE_A);
  });
  linesAndPoints.cull((x, y) => {
    return b.relatePoint(x, y, tolerance) !== DISJOINT;
  });
  return createMultiGeometry(rings, linesAndPoints).simplify();
}
