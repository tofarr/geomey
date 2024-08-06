import { createMeshes } from "../../mesh/MeshPathWalker";
import { addExplicitPointsOfIntersection } from "../../mesh/op/addExplicitPointsOfIntersection";
import { DISJOINT } from "../../Relation";
import { Tolerance } from "../../Tolerance";
import { Geometry, GeometryCollection } from "../";

export function xor(a: Geometry, b: Geometry, tolerance: Tolerance): Geometry {
  const meshes = createMeshes(tolerance, a, b);
  const [rings, linesAndPoints] = meshes;
  addExplicitPointsOfIntersection(rings, linesAndPoints);
  linesAndPoints.cull((x, y) => {
    return (
      (a.relatePoint(x, y, tolerance) === DISJOINT) !=
      (b.relatePoint(x, y, tolerance) === DISJOINT)
    );
  });
  return GeometryCollection.fromMeshes(rings, linesAndPoints).normalize();
}
