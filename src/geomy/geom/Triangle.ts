import { NumberFormatter } from "../formatter";
import { PathWalker } from "../path/PathWalker";
import { B_INSIDE_A, DISJOINT, Relation, TOUCH } from "../Relation";
import { Tolerance } from "../Tolerance";
import { Transformer } from "../transformer/Transformer";
import { AbstractGeometry } from "./AbstractGeometry";
import { Geometry } from "./Geometry";
import { ringToWkt } from "./LinearRing";
import { signedPerpendicularDistance } from "./LineSegment";
import { Point } from "./Point";
import { Rectangle } from "./Rectangle";

export class Triangle extends AbstractGeometry {
  readonly ax: number;
  readonly ay: number;
  readonly bx: number;
  readonly by: number;
  readonly cx: number;
  readonly cy: number;

  private constructor(
    ax: number,
    ay: number,
    bx: number,
    by: number,
    cx: number,
    cy: number,
  ) {
    super();
    this.ax = ax;
    this.ay = ay;
    this.bx = bx;
    this.by = by;
    this.cx = cx;
    this.cy = cy;
  }
  static valueOf(
    ax: number,
    ay: number,
    bx: number,
    by: number,
    cx: number,
    cy: number,
  ) {
    return new Triangle(ax, ay, bx, by, cx, cy);
  }
  static unsafeValueOf(
    ax: number,
    ay: number,
    bx: number,
    by: number,
    cx: number,
    cy: number,
  ) {
    return new Triangle(ax, ay, bx, by, cx, cy);
  }
  calculateCentroid(): Point {
    return Point.unsafeValueOf(
      (this.ax + this.bx + this.cx) / 3,
      (this.ay + this.by + this.cy) / 3,
    );
  }
  calculateBounds(): Rectangle {
    return Rectangle.valueOf([
      this.ax,
      this.ay,
      this.bx,
      this.by,
      this.cx,
      this.cy,
    ]);
  }
  walkPath(pathWalker: PathWalker): void {
    pathWalker.moveTo(this.ax, this.ay);
    pathWalker.lineTo(this.bx, this.by);
    pathWalker.lineTo(this.cx, this.cy);
    pathWalker.closePath();
  }
  toWkt(numberFormatter?: NumberFormatter): string {
    const { ax, ay, bx, by, cx, cy } = this;
    const result = ["POLYGON("];
    ringToWkt([ax, ay, bx, by, cx, cy], numberFormatter, false, result);
    result.push(")");
    return result.join("");
  }
  toGeoJson() {
    const { ax, ay, bx, by, cx, cy } = this;
    return {
      type: "POLYGON",
      coordinates: [
        [ax, ay],
        [bx, by],
        [cx, cy],
        [ax, ay],
      ],
    };
  }
  transform(transformer: Transformer): Geometry {
    const { ax, ay, bx, by, cx, cy } = this;
    return Triangle.valueOf.apply(
      transformer.transformAll([ax, ay, bx, by, cx, cy]),
    );
  }
  generalize(tolerance: Tolerance): Geometry {
    if (this.getBounds().isCollapsible(tolerance)) {
      return this.getCentroid();
    }
    return this;
  }
  relatePoint(x: number, y: number, tolerance: Tolerance): Relation {
    const { ax, ay, bx, by, cx, cy } = this;
    const ab = signedPerpendicularDistance(x, y, ax, ay, bx, by);
    const bc = signedPerpendicularDistance(x, y, bx, by, cx, cy);
    const ca = signedPerpendicularDistance(x, y, cx, cy, ax, ay);
    const outside = -tolerance.tolerance;
    if (ab < outside || bc < outside || ca < outside) {
      return DISJOINT;
    }
    const inside = tolerance.tolerance;
    if (ab > inside && bc > inside && ca > inside) {
      return B_INSIDE_A;
    }
    let result = TOUCH;
    if (ab > inside || bc > inside || ca > inside) {
      result |= B_INSIDE_A;
    }
    return result;
  }
}
