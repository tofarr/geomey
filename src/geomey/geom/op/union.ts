import { createMeshes } from "../../mesh/MeshPathWalker";
import { B_INSIDE_A } from "../../Relation";
import { Tolerance } from "../../Tolerance";
import { Geometry, GeometryCollection } from "../";
import { addExplicitPointsOfIntersection } from "../../mesh/op/addExplicitPointsOfIntersection";

export function union(
  a: Geometry,
  b: Geometry,
  tolerance: Tolerance,
): Geometry {
  const [rings, linesAndPoints] = createMeshes(tolerance, a, b);
  addExplicitPointsOfIntersection(rings, linesAndPoints);

  function isInside(x, y) {
    return !!(
      a.relatePoint(x, y, tolerance) & B_INSIDE_A ||
      b.relatePoint(x, y, tolerance) & B_INSIDE_A
    );
  }
  rings.cull(isInside);
  linesAndPoints.cull(isInside);
  return GeometryCollection.fromMeshes(rings, linesAndPoints).normalize();
}
