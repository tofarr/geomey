import { createMeshes } from "../../mesh/MeshPathWalker";
import { addExplicitPointsOfIntersection } from "../../mesh/op/addExplicitPointsOfIntersection";
import { DISJOINT } from "../../Relation";
import { Tolerance } from "../../Tolerance";
import { Geometry, GeometryCollection } from "../";

export function xor(a: Geometry, b: Geometry, tolerance: Tolerance): Geometry {
  const [rings, linesAndPoints] = createMeshes(tolerance, a, b);
  addExplicitPointsOfIntersection(rings, linesAndPoints);
  function isInside(x, y) {
    return !!(
      (a.relatePoint(x, y, tolerance) === DISJOINT) ==
      (b.relatePoint(x, y, tolerance) === DISJOINT)
    );
  }
  rings.cull(isInside);
  linesAndPoints.cull(isInside);
  return GeometryCollection.fromMeshes(rings, linesAndPoints).normalize();
}
