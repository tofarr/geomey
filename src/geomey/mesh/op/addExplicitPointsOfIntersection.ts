import { forEachLineSegmentCoordinates } from "../../coordinate";
import { Mesh } from "../Mesh";

export function addExplicitPointsOfIntersection(a: Mesh, b: Mesh) {
  addExplicitPointsOfIntersectionToA(a, b);
  addExplicitPointsOfIntersectionToA(b, a);
}

export function addExplicitPointsOfIntersectionToA(a: Mesh, b: Mesh) {
  for (const edgeA of a.getEdges()) {
    const { a: i, b: j } = edgeA;
    const { x: ix, y: iy } = i;
    const { x: jx, y: jy } = j;
    const intersections = b.getIntersections(ix, iy, jx, jy);
    if (intersections.length) {
      a.removeLink(ix, iy, jx, jy);
      let px = ix;
      let py = iy;
      for (const intersection of intersections) {
        const { vertex } = intersection;
        let vx = vertex.x;
        let vy = vertex.y;
        a.addLink(px, py, vx, vy);
        px = vx;
        py = vy;
      }
      a.addLink(px, py, jx, jy)
    }
  }
}
