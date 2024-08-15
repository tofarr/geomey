import { createMeshes } from "../../mesh/MeshPathWalker";
import { addExplicitPointsOfIntersection } from "../../mesh/op/addExplicitPointsOfIntersection";
import { DISJOINT, TOUCH } from "../../Relation";
import { Tolerance } from "../../Tolerance";
import { Geometry, GeometryCollection } from "../";

export function xor(a: Geometry, b: Geometry, tolerance: Tolerance): Geometry | null {
  const [rings, linesAndPoints] = createMeshes(tolerance, a, b);
  addExplicitPointsOfIntersection(rings, linesAndPoints);
  rings.cullLinks((x, y) => {
    return !!(
      (a.relatePoint(x, y, tolerance) & TOUCH) &&
      (b.relatePoint(x, y, tolerance) & TOUCH)
    );
  });
  linesAndPoints.cull((x, y) => {
    return (
      (a.relatePoint(x, y, tolerance) !== DISJOINT) &&
      (b.relatePoint(x, y, tolerance) !== DISJOINT)
    )
  });
  const geometry = GeometryCollection.fromMeshes(rings, linesAndPoints);
  return geometry ? geometry.normalize() : null;
}
