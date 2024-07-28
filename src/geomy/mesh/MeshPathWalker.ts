import { forEachLineSegmentCoordinates } from "../coordinate";
import { Geometry } from "../geom/Geometry";
import {
  perpendicularDistance,
  signedPerpendicularDistance,
} from "../geom/LineSegment";
import { Tolerance } from "../Tolerance";
import { Mesh } from "./Mesh";

export class MeshPathWalker implements PathWalker {
  rings: Mesh;
  linesAndPoints: Mesh;
  coordinates: number[];

  constructor(rings: Mesh, linesAndPoints: Mesh) {
    this.rings = rings;
    this.linesAndPoints = linesAndPoints;
    this.coordinates = [];
  }
  static valueOf(tolerance: Tolerance): MeshPathWalker {
    return new MeshPathWalker(new Mesh(tolerance), new Mesh(tolerance));
  }
  moveTo(x: number, y: number): void {
    const { coordinates } = this;
    const { length } = coordinates;
    if (length) {
      if (length == 2) {
        this.linesAndPoints.addVertex(coordinates[0], coordinates[1]);
      } else {
        forEachLineSegmentCoordinates(coordinates, (ax, ay, bx, by) => {
          this.linesAndPoints.addLink(ax, ay, bx, by);
        });
      }
    }
    coordinates.length = 0;
  }
  lineTo(x: number, y: number): void {
    this.coordinates.push(x, y);
  }
  bezierCurveTo(
    bx: number,
    by: number,
    cx: number,
    cy: number,
    dx: number,
    dy: number,
  ): void {
    const { coordinates, linesAndPoints, rings } = this;
    const { length } = coordinates;
    const ax = coordinates[length - 2];
    const ay = coordinates[length - 2];
    const { tolerance } = linesAndPoints || rings;
    if (
      tolerance.match(0, signedPerpendicularDistance(ax, ay, dx, dy, bx, by)) &&
      tolerance.match(0, signedPerpendicularDistance(ax, ay, dx, dy, cx, cy))
    ) {
      this.lineTo(dx, dy);
      return;
    }

    const abx = mid(ax, bx);
    const aby = mid(ay, by);
    const bcx = mid(bx, cx);
    const bcy = mid(by, cy);
    const cdx = mid(cx, dx);
    const cdy = mid(cy, dy);

    const abcx = mid(abx, bcx);
    const abcy = mid(aby, bcy);
    const bcdx = mid(bcx, cdx);
    const bcdy = mid(bcy, cdy);

    const abcdx = mid(abcx, bcdx);
    const abcdy = mid(abcy, bcdy);

    this.bezierCurveTo(abx, aby, abcx, abcy, abcdx, abcdy);
    this.bezierCurveTo(bcdx, bcdy, cdx, cdy, dx, dy);
  }
  closePath(): void {
    const { coordinates } = this;
    coordinates.push(coordinates[0], coordinates[1]);
    forEachLineSegmentCoordinates(coordinates, (ax, ay, bx, by) => {
      this.rings.addLink(ax, ay, bx, by);
    });
    coordinates.length = 0;
  }
}

function mid(a, b) {
  return (a + b) / 2;
}

export function createMeshes(
  tolerance: Tolerance,
  ...geometries: Geometry[]
): [Mesh, Mesh] {
  const pathWalker = MeshPathWalker.valueOf(tolerance);
  for (const geometry of geometries) {
    geometry.walkPath(pathWalker);
  }
  return [pathWalker.rings, pathWalker.linesAndPoints];
}
