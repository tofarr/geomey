import { createMeshes } from "../../mesh/MeshPathWalker";
import { addExplicitPointsOfIntersection } from "../../mesh/op/addExplicitPointsOfIntersection";
import { B_INSIDE_A, DISJOINT, TOUCH } from "../../Relation";
import { Tolerance } from "../../Tolerance";
import { Geometry, GeometryCollection } from "../";
import { Mesh } from "../../mesh/Mesh";
import { Vertex } from "../../mesh/Vertex";

export function less(
  a: Geometry,
  b: Geometry,
  tolerance: Tolerance,
): Geometry | null {
  const meshes = createMeshes(tolerance, a, b);
  const [rings, linesAndPoints] = meshes;
  addExplicitPointsOfIntersection(rings, linesAndPoints);

  const touchBoth = new Mesh(tolerance);
  const toRemove = [];
  rings.forEachEdge(({ a: i, b: j }) => {
    const { x: ix, y: iy } = i;
    const { x: jx, y: jy } = j;
    const x = (ix + jx) / 2;
    const y = (iy + jy) / 2;
    const relateB = b.relatePoint(x, y, tolerance);
    if (relateB & B_INSIDE_A) {
      toRemove.push(ix, iy, jx, jy);
    } else if (relateB & TOUCH) {
      const relateA = a.relatePoint(x, y, tolerance);
      if (relateA & TOUCH) {
        touchBoth.addLink(ix, iy, jx, jy);
        toRemove.push(ix, iy, jx, jy);
      } else if (relateA === DISJOINT) {
        toRemove.push(ix, iy, jx, jy);
      }
    }
  });

  for (let n = 0; n < toRemove.length; ) {
    rings.removeLink(
      toRemove[n++],
      toRemove[n++],
      toRemove[n++],
      toRemove[n++],
    );
  }

  rings.forEachVertex((vertex) => {
    relink(vertex, rings, touchBoth);
  });

  rings.forEachVertex(({ x, y, links }) => {
    if (!links.length) {
      rings.removePoint(x, y);
    }
  });

  linesAndPoints.cullEdges((x, y) => {
    return b.relatePoint(x, y, tolerance) !== DISJOINT;
  });
  linesAndPoints.cullVertices((x, y, links) => {
    const relate = b.relatePoint(x, y, tolerance);
    if (relate & B_INSIDE_A) {
      return true;
    }
    if (relate & TOUCH && !links.length) {
      return true;
    }
    return false;
  });

  const geometry = GeometryCollection.fromMeshes(rings, linesAndPoints);
  // Another step is required here - linear rings may still be invalid if they overlap with b
  return geometry ? geometry.normalize() : null;
}

function relink(vertex: Vertex, rings: Mesh, touchBoth: Mesh) {
  if (vertex.links.length === 1) {
    const { x, y } = vertex;
    const { links } = touchBoth.getVertex(vertex.x, vertex.y);
    for (const toLink of links) {
      rings.addLink(x, y, toLink.x, toLink.y);
    }
    for (const toLink of links) {
      relink(rings.getVertex(toLink.x, toLink.y), rings, touchBoth);
    }
  }
}
