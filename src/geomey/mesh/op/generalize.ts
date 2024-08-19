import {
  forEachCoordinate,
  forEachLineSegmentCoordinates,
} from "../../coordinate";
import { douglasPeucker } from "../../geom";
import { Tolerance } from "../../Tolerance";
import { Mesh } from "../Mesh";
import { snap } from "./snap";

export function generalize(mesh: Mesh, tolerance: Tolerance) {
  snap(mesh, tolerance);
  mesh.forEachLineString((coordinates: number[]) => {
    const generalized = douglasPeucker(coordinates, tolerance.tolerance);
    if (coordinates.length === generalized.length) {
      return;
    }
    forEachLineSegmentCoordinates(coordinates, (ax, ay, bx, by) => {
      mesh.removeLink(ax, ay, bx, by);
    });
    forEachCoordinate(coordinates, (x, y) => {
      const vertex = mesh.getVertex(x, y);
      if (vertex && !vertex.links.length) {
        mesh.removeVertex(x, y);
      }
    });
    forEachLineSegmentCoordinates(generalized, (ax, ay, bx, by) => {
      mesh.addLink(ax, ay, bx, by);
    });
  });
}
