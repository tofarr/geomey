import { createMeshes } from "../../mesh/MeshPathWalker";
import { addExplicitPointsOfIntersection } from "../../mesh/op/addExplicitPointsOfIntersection";
import { B_INSIDE_A, DISJOINT } from "../../Relation";
import { Tolerance } from "../../Tolerance";
import { Geometry, GeometryCollection } from "../";

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
  return GeometryCollection.fromMeshes(rings, linesAndPoints).normalize();
}
