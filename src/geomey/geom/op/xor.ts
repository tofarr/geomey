import { createMeshes } from "../../mesh/MeshPathWalker";
import { addExplicitPointsOfIntersection } from "../../mesh/op/addExplicitPointsOfIntersection";
import { DISJOINT, TOUCH } from "../../Relation";
import { Tolerance } from "../../Tolerance";
import { Geometry, GeometryCollection } from "../";

export function xor(
  a: Geometry,
  b: Geometry,
  tolerance: Tolerance,
): Geometry | null {
  const [rings, linesAndPoints] = createMeshes(tolerance, a, b);
  addExplicitPointsOfIntersection(rings, linesAndPoints);
  rings.cullLinks((x, y) => {
    return !!(
      a.relatePoint(x, y, tolerance) & TOUCH &&
      b.relatePoint(x, y, tolerance) & TOUCH
    );
  });

  linesAndPoints.cullLinks((x, y) => {
    return (
      a.relatePoint(x, y, tolerance) !== DISJOINT &&
      b.relatePoint(x, y, tolerance) !== DISJOINT
    );
  });
  linesAndPoints.cullVertices((x, y, links) => {
    const relateA = a.relatePoint(x, y, tolerance);
    const relateB = b.relatePoint(x, y, tolerance);
    if (relateA & TOUCH && relateB & TOUCH) {
      return !links.length;
    }
    return relateA !== DISJOINT && relateB !== DISJOINT;
  });

  const geometry = GeometryCollection.fromMeshes(rings, linesAndPoints);
  return geometry ? geometry.normalize() : null;
}
