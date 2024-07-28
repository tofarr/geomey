import {
  forEachCoordinate,
  forEachLineSegmentCoordinates,
} from "../../coordinate";
import { douglasPeucker } from "../../geom/LineString";
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
    forEachCoordinate(
      coordinates,
      (x, y) => {
        mesh.removeVertex(x, y);
      },
      1,
      coordinates.length >> (1 - 1),
    );
    forEachLineSegmentCoordinates(generalized, (ax, ay, bx, by) => {
      mesh.addLink(ax, ay, bx, by);
    });
  });
}
