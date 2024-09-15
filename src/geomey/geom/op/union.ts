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

  const toRemove = []
  linesAndPoints.forEachEdge(edge => {
    const {a, b} = edge
    if(rings.hasLink(a.x, a.y, b.x, b.y)) {
      toRemove.push(edge)
    }
  })
  for (const edge of toRemove) {
    const {a, b} = edge
    linesAndPoints.removeLink(a.x, a.y, b.x, b.y)
  }

  linesAndPoints.cullVertices((x, y, links) => {
    if (links.length) {
      return false
    }
    return rings.getVertex(x, y) != null
  })

  return GeometryCollection.fromMeshes(rings, linesAndPoints).normalize();
}
