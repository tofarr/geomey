import {
  A_OUTSIDE_B,
  B_OUTSIDE_A,
  DISJOINT,
  flipAB,
  Relation,
  TOUCH,
} from "../Relation";
import { Tolerance } from "../Tolerance";
import {
  comparePointsForSort,
  coordinateMatch,
  InvalidCoordinateError,
  isNaNOrInfinite,
} from "../coordinate";
import { NUMBER_FORMATTER, NumberFormatter } from "../formatter";
import { GeoJsonLineString } from "../geoJson";
import { PathWalker } from "../path/PathWalker";
import { Transformer } from "../transformer/Transformer";
import {
  Geometry,
  LineString,
  relateLineStringToLineSegment,
  Point,
  Rectangle,
} from "./";
import { intersection } from "./op/intersection";
import { less } from "./op/less";
import { relate } from "./op/relate";
import { union } from "./op/union";
import { xor } from "./op/xor";

export class LineSegment implements Geometry {
  readonly ax: number;
  readonly ay: number;
  readonly bx: number;
  readonly by: number;
  private centroid?: Point;
  private bounds?: Rectangle;

  constructor(ax: number, ay: number, bx: number, by: number) {
    if (
      isNaNOrInfinite(ax, ay, bx, by) ||
      !comparePointsForSort(ax, ay, bx, by)
    ) {
      throw new InvalidCoordinateError([ax, ay, bx, by]);
    }
    this.ax = ax;
    this.ay = ay;
    this.bx = bx;
    this.by = by;
  }
  getCentroid(): Point {
    let { centroid } = this;
    if (!centroid) {
      centroid = this.centroid = Point.valueOf(
        (this.ax + this.bx) / 2,
        (this.ay + this.by) / 2,
      );
    }
    return centroid;
  }
  getBounds(): Rectangle {
    let { bounds } = this;
    if (!bounds) {
      bounds = this.bounds = Rectangle.valueOf([
        this.ax,
        this.ay,
        this.bx,
        this.by,
      ]);
    }
    return bounds;
  }
  getInternalArea(): null {
    return null;
  }
  getDx() {
    return this.bx - this.ax;
  }
  getDy() {
    return this.by - this.ay;
  }
  getSlope() {
    return this.getDy() / this.getDx();
  }
  getLength() {
    return getLength(this.ax, this.ay, this.bx, this.by);
  }
  walkPath(pathWalker: PathWalker): void {
    pathWalker.moveTo(this.ax, this.ay);
    pathWalker.lineTo(this.bx, this.by);
  }
  toWkt(f: NumberFormatter = NUMBER_FORMATTER): string {
    return `LINESTRING(${f(this.ax)} ${f(this.ay)}, ${f(this.bx)} ${f(
      this.by,
    )})`;
  }
  toGeoJson(): GeoJsonLineString {
    return {
      type: "LineString",
      coordinates: [
        [this.ax, this.ay],
        [this.bx, this.by],
      ],
    };
  }
  isNormalized(): boolean {
    const { ax, ay, bx, by } = this;
    return comparePointsForSort(ax, ay, bx, by) < 0;
  }
  isValid(tolerance: Tolerance): boolean {
    const { ax, ay, bx, by } = this;
    return !coordinateMatch(ax, ay, bx, by, tolerance);
  }
  normalize(): LineSegment | Point {
    const { ax, ay, bx, by } = this;
    const compare = comparePointsForSort(ax, ay, bx, by);
    if (compare < 0) {
      return this;
    } else {
      return new LineSegment(bx, by, ax, ay);
    }
  }
  transform(transformer: Transformer): LineSegment | Point {
    const [ax, ay, bx, by] = transformer.transformAll([
      this.ax,
      this.ay,
      this.bx,
      this.by,
    ]);
    if (ax == bx && ay == by) {
      return Point.valueOf(ax, ay);
    }
    return new LineSegment(ax, ay, bx, by);
  }
  generalize(tolerance: Tolerance): LineSegment | Point {
    if (this.getBounds().isCollapsible(tolerance)) {
      return this.getCentroid();
    }
    return this;
  }
  relatePoint(x: number, y: number, tolerance: Tolerance): Relation {
    return relatePointToLineSegment(
      x,
      y,
      this.ax,
      this.ay,
      this.bx,
      this.by,
      tolerance,
    );
  }
  relate(other: Geometry, tolerance: Tolerance): Relation {
    if (this.getBounds().isDisjointRectangle(other.getBounds(), tolerance)) {
      return DISJOINT;
    }
    if (other instanceof Point) {
      return relatePointToLineSegment(
        other.x,
        other.y,
        this.ax,
        this.ay,
        this.bx,
        this.by,
        tolerance,
      );
    }
    if (other instanceof LineSegment) {
      return relateLineSegments(
        this.ax,
        this.ay,
        this.bx,
        this.by,
        other.ax,
        other.ay,
        other.bx,
        other.by,
        tolerance,
      );
    }
    if (other instanceof LineString) {
      return flipAB(
        relateLineStringToLineSegment(
          other.coordinates,
          this.ax,
          this.ay,
          this.bx,
          this.by,
          tolerance,
        ),
      );
    }
    return relate(this, other, tolerance);
  }
  union(other: Geometry, tolerance: Tolerance): Geometry {
    return union(this, other, tolerance);
  }
  intersection(other: Geometry, tolerance: Tolerance): Geometry | null {
    return intersection(this, other, tolerance);
  }
  less(other: Geometry, tolerance: Tolerance): Geometry | null {
    return less(this, other, tolerance);
  }
  xor(other: Geometry, tolerance: Tolerance): Geometry | null {
    return xor(this, other, tolerance);
  }
}

export function signedPerpendicularDistance(
  x: number,
  y: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const numerator = Math.abs((by - ay) * x - (bx - ax) * y + bx * ay - by * ax);
  const denominator = getLength(ax, ay, bx, by);
  return numerator / denominator;
}

export function perpendicularDistance(
  x: number,
  y: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  if (ax === bx && ay === by) {
    return Math.sqrt((x - ax) ** 2 + (y - ay) ** 2);
  }
  return Math.abs(signedPerpendicularDistance(x, y, ax, ay, bx, by));
}

export function intersectionLineSegment(
  iax: number,
  iay: number,
  ibx: number,
  iby: number,
  jax: number,
  jay: number,
  jbx: number,
  jby: number,
  tolerance: Tolerance,
): Point | null {
  // First normalize to get consistent results
  if (comparePointsForSort(iax, iay, ibx, iby) > 0) {
    [ibx, iby, iax, iay] = [iax, iay, ibx, iby];
  }
  if (comparePointsForSort(jax, jay, jbx, jby) > 0) {
    [jbx, jby, jax, jay] = [jax, jay, jbx, jby];
  }
  if (
    (comparePointsForSort(iax, iay, jax, jay) ||
      comparePointsForSort(ibx, iby, jbx, jby)) > 0
  ) {
    [iax, iay, ibx, iby, jax, jay, jbx, jby] = [
      jax,
      jay,
      jbx,
      jby,
      iax,
      iay,
      ibx,
      iby,
    ];
  }

  const denom = (jby - jay) * (ibx - iax) - (jbx - jax) * (iby - iay);
  if (denom == 0.0) {
    return null; // Lines are parallel.
  }

  // projected distance along i and j
  const ui = ((jbx - jax) * (iay - jay) - (jby - jay) * (iax - jax)) / denom;
  const uj = ((ibx - iax) * (iay - jay) - (iby - iay) * (iax - jax)) / denom;

  // point of intersection
  const x = ui * (ibx - iax) + iax;
  const y = ui * (iby - iay) + iay;

  if (coordinateMatch(x, y, iax, iay, tolerance)) {
    if (
      coordinateMatch(x, y, jax, jay, tolerance) ||
      coordinateMatch(x, y, jbx, jby, tolerance) ||
      (uj >= 0 && uj <= 1)
    ) {
      return Point.valueOf(iax, iay);
    }
  } else if (coordinateMatch(x, y, ibx, iby, tolerance)) {
    if (
      coordinateMatch(x, y, jax, jay, tolerance) ||
      coordinateMatch(x, y, jbx, jby, tolerance) ||
      (uj >= 0 && uj <= 1)
    ) {
      return Point.valueOf(ibx, iby);
    }
  } else if (coordinateMatch(x, y, jax, jay, tolerance)) {
    if (ui >= 0 && ui <= 1) {
      return Point.valueOf(jax, jay);
    }
  } else if (coordinateMatch(x, y, jbx, jby, tolerance)) {
    if (ui >= 0 && ui <= 1) {
      return Point.valueOf(jbx, jby);
    }
  } else if (ui > 0 && ui < 1 && uj > 0 && uj < 1) {
    return Point.valueOf(x, y);
  }
  return null;
}

export function projectProgress(
  x: number,
  y: number,
  ax: number,
  ay: number,
  abx: number,
  aby: number,
): number {
  // Calculate the vector from A to the point
  const apx = x - ax;
  const apy = y - ay;

  // Calculate the projection of ap onto ab
  const abab = abx * abx + aby * aby;
  const apab = apx * abx + apy * aby;
  const progress = apab / abab;
  return progress;
}

export function pointTouchesLineSegment(
  x: number,
  y: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  tolerance: Tolerance,
) {
  if (tolerance.outside(perpendicularDistance(x, y, ax, ay, bx, by))) {
    return false;
  }

  // Calculate the vector from A to B
  const abx = bx - ax;
  const aby = by - ay;

  const progress = projectProgress(x, y, ax, ay, abx, aby);

  if (progress >= 0 && progress <= 1) {
    return true;
  }

  // Get projected point
  const px = ax + progress * abx;
  const py = ay + progress * aby;

  if (coordinateMatch(px, py, ax, ay, tolerance)) {
    // if projected point is very close to a, use a
    return true;
  } else if (coordinateMatch(px, py, bx, by, tolerance)) {
    // if projected point is very close to b, use b
    return true;
  }
  return false;
}

export function relatePointToLineSegment(
  x: number,
  y: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  tolerance: Tolerance,
): Relation {
  let result = A_OUTSIDE_B;
  if (pointTouchesLineSegment(x, y, ax, ay, bx, by, tolerance)) {
    result |= TOUCH;
  } else {
    result |= B_OUTSIDE_A;
  }
  return result as Relation;
}

export function relateLineSegments(
  iax: number,
  iay: number,
  ibx: number,
  iby: number,
  jax: number,
  jay: number,
  jbx: number,
  jby: number,
  tolerance: Tolerance,
): Relation {
  const iaj = relatePointToLineSegment(iax, iay, jax, jay, jbx, jby, tolerance);
  const ibj = relatePointToLineSegment(ibx, iby, jax, jay, jbx, jby, tolerance);
  const jai = relatePointToLineSegment(jax, jay, iax, iay, ibx, iby, tolerance);
  const jbi = relatePointToLineSegment(jbx, jby, iax, iay, ibx, iby, tolerance);
  if (iaj & TOUCH && ibj & TOUCH) {
    if (jai & TOUCH && jbi & TOUCH) {
      return TOUCH;
    }
    return (TOUCH | B_OUTSIDE_A) as Relation;
  }
  if (jai & TOUCH && jbi & TOUCH) {
    return (TOUCH | A_OUTSIDE_B) as Relation;
  }
  if (iaj & TOUCH || ibj & TOUCH || jai & TOUCH || jbi & TOUCH) {
    return (A_OUTSIDE_B | B_OUTSIDE_A | TOUCH) as Relation;
  }
  const intersection = intersectionLineSegment(
    iax,
    iay,
    ibx,
    iby,
    jax,
    jay,
    jbx,
    jby,
    tolerance,
  );
  if (!intersection) {
    return DISJOINT;
  }
  return (A_OUTSIDE_B | B_OUTSIDE_A | TOUCH) as Relation;
}

export function getLength(ax: number, ay: number, bx: number, by: number) {
  return Math.sqrt((by - ay) ** 2 + (bx - ax) ** 2);
}
