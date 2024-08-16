import { forEachLineSegmentCoordinates } from "../../coordinate";
import { Mesh } from "../Mesh";

export function addExplicitPointsOfIntersection(a: Mesh, b: Mesh) {
  addExplicitPointsOfIntersectionToA(a, b);
  addExplicitPointsOfIntersectionToA(b, a);
}

export function addExplicitPointsOfIntersectionToA(a: Mesh, b: Mesh) {
  for(const linkA of a.getLinks()) {
    const { a: i, b: j } = linkA;
    const { x: ix, y: iy } = i;
    const { x: jx, y: jy } = j;
    const intersections = b.getIntersections(ix, iy, jx, jy);
    if (intersections.length) {
      intersections.splice(0, 0, ix, iy);
      intersections.push(jx, jy);
      a.removeLink(ix, iy, jx, jy);
      forEachLineSegmentCoordinates(intersections, (ax, ay, bx, by) => {
        a.addLink(ax, ay, bx, by);
      });
    }
  }
}
