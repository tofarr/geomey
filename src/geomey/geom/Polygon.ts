import {
  A_INSIDE_B,
  A_OUTSIDE_B,
  B_INSIDE_A,
  B_OUTSIDE_A,
  DISJOINT,
  Relation,
  TOUCH,
} from "../Relation";
import { Tolerance } from "../Tolerance";
import { NUMBER_FORMATTER, NumberFormatter } from "../formatter";
import { GeoJsonPolygon } from "../geoJson";
import { Mesh } from "../mesh/Mesh";
import { MeshPathWalker } from "../mesh/MeshPathWalker";
import { generalize } from "../mesh/op/generalize";
import { PathWalker } from "../path/PathWalker";
import { Transformer } from "../transformer/Transformer";
import {
  AbstractGeometry,
  forEachRingCoordinate,
  LinearRing,
  ringToWkt,
  Geometry,
  LineSegment,
  LineString,
  GeometryCollection,
  Point,
  Rectangle,
  compareLinearRingsForSort,
  forEachRingLineSegmentCoordinates,
  MultiLineString,
  MultiPoint,
} from "./";
import { PolygonBuilder } from "./builder/PolygonBuilder";

const NO_HOLES: ReadonlyArray<LinearRing> = [];

/**
 * A polygon is a non self intersecting linear ring of coordinates. Unlike WKT, the first coordinate is not
 * repeated at the end of the coordinate array. The shell of a valid polygon will not self intersect.
 *
 * A polygon may contain child polygons which serve as holes. These must be fully contained inside and not touch
 * the outer shell, and must not touch or overlap with each other.
 */
export class Polygon extends AbstractGeometry {
  readonly shell: LinearRing;
  readonly holes: ReadonlyArray<LinearRing>;

  constructor(shell: LinearRing, holes?: ReadonlyArray<LinearRing>) {
    super();
    this.shell = shell;
    this.holes = holes || NO_HOLES;
  }
  static fromMesh(mesh: Mesh): Polygon[] {
    const rings = LinearRing.fromMesh(mesh);
    const builders = [];
    const { tolerance } = mesh;
    for (const ring of rings) {
      addRing(ring, tolerance, builders);
    }
    const results = [];
    for (const builder of builders) {
      createPolygon(builder, results);
    }
    return results;
  }
  protected calculateCentroid(): Point {
    return this.shell.getCentroid();
  }
  protected calculateBounds(): Rectangle {
    return this.shell.getBounds();
  }
  walkPath(pathWalker: PathWalker): void {
    // Walk in reverse
    this.shell.walkPath(pathWalker);
    const { holes } = this;
    for (const hole of holes) {
      hole.walkPathReverse(pathWalker);
    }
  }
  toWkt(numberFormatter: NumberFormatter = NUMBER_FORMATTER): string {
    const result = ["POLYGON("];
    ringToWkt(this.shell.coordinates, numberFormatter, false, result);
    for (const hole of this.holes) {
      result.push(",");
      ringToWkt(hole.coordinates, numberFormatter, true, result);
    }
    result.push(")");
    return result.join("");
  }
  toGeoJson(): GeoJsonPolygon {
    const coordinates = [];
    const shell = [];
    forEachRingCoordinate(
      this.shell.coordinates,
      (x, y) => {
        shell.push([x, y]);
      },
      false,
    );
    coordinates.push(shell);
    for (const hole of this.holes) {
      const holeCoordinates = [];
      forEachRingCoordinate(
        hole.coordinates,
        (x, y) => {
          holeCoordinates.push([x, y]);
        },
        true,
      );
      coordinates.push(holeCoordinates);
    }
    return {
      type: "Polygon",
      coordinates,
    };
  }
  calculateMesh(tolerance: Tolerance): Mesh {
    const mesh = new Mesh(tolerance);
    forEachRingLineSegmentCoordinates(
      this.shell.coordinates,
      (ax, ay, bx, by) => {
        mesh.addLink(ax, ay, bx, by);
      },
    );
    for (const hole of this.holes) {
      forEachRingLineSegmentCoordinates(hole.coordinates, (ax, ay, bx, by) => {
        mesh.addLink(ax, ay, bx, by);
      });
    }
    return mesh;
  }
  isValid(tolerance: Tolerance): boolean {
    if (this.getBounds().isCollapsible(tolerance)) {
      return false;
    }
    const { shell, holes } = this;
    if (!shell.isValid(tolerance) || shell.getArea() < 0) {
      return false;
    }
    if (holes.find((hole) => !hole.isValid(tolerance) || hole.getArea() < 0)) {
      return false;
    }
    const mesh = this.calculateMesh(tolerance);
    return mesh.forEachVertexAndLinkCentroid((x, y) => {
      if (shell.relatePoint(x, y, tolerance) === DISJOINT) {
        return false;
      }
      if (
        holes.find((hole) => hole.relatePoint(x, y, tolerance) & B_INSIDE_A)
      ) {
        return false; // Inside implies that holes overlap
      }
      return true;
    });
  }
  isNormalized(): boolean {
    if (!this.shell.isNormalized()) {
      return false;
    }
    const { holes } = this;
    if (holes.find((hole) => !hole.isNormalized())) {
      return false;
    }
    if (holes.length) {
      for (let h = 1; h < holes.length; h++) {
        if (compareLinearRingsForSort(holes[h - 1], holes[h]) > 0) {
          return false;
        }
      }
    }
    return true;
  }
  calculateNormalized(): Polygon {
    if (this.isNormalized()) {
      return this;
    }
    const shell = this.shell.normalize() as LinearRing;
    const holes = this.holes.map((hole) => hole.normalize() as LinearRing);
    holes.sort(compareLinearRingsForSort);
    const result = new Polygon(shell, holes);
    result.normalized = result;
    return result;
  }
  generalize(tolerance: Tolerance): Geometry {
    const shell: Geometry = this.shell;
    if (shell.getBounds().isCollapsible(tolerance)) {
      return this.getCentroid();
    }

    const walker = MeshPathWalker.valueOf(tolerance);
    this.walkPath(walker);
    const [rings, linesAndPoints] = walker.getMeshes();
    generalize(rings, tolerance);
    return GeometryCollection.fromMeshes(rings, linesAndPoints).normalize();
  }
  transform(transformer: Transformer): Polygon {
    const shell = this.shell.transform(transformer);
    const holes = this.holes.map((hole) => hole.transform(transformer));
    return new Polygon(shell, holes).normalize() as Polygon;
  }
  relatePoint(x: number, y: number, tolerance: Tolerance): Relation {
    const relation = this.shell.relatePoint(x, y, tolerance);
    if (!(relation & B_INSIDE_A)) {
      return relation;
    }
    for (const hole of this.holes) {
      const holeRelation = hole.relatePoint(x, y, tolerance);
      if (holeRelation & TOUCH) {
        return (TOUCH | A_OUTSIDE_B) as Relation;
      }
      if (holeRelation & B_INSIDE_A) {
        return (A_OUTSIDE_B | B_OUTSIDE_A) as Relation; // inside a hole is outside!
      }
    }
    return relation;
  }
  protected lessGeometry(other: Geometry, tolerance: Tolerance): Geometry {
    if (
      other instanceof Point ||
      other instanceof LineSegment ||
      other instanceof LineString ||
      other instanceof MultiLineString ||
      other instanceof MultiPoint ||
      (other instanceof GeometryCollection && !other.polygons)
    ) {
      return this;
    }
    return super.lessGeometry(other, tolerance);
  }
}

function createPolygon(builder: PolygonBuilder, results: Polygon[]) {
  const { children } = builder;
  results.push(
    new Polygon(
      builder.shell,
      children.map((c) => c.shell),
    ),
  );
  for (const child of children) {
    for (const grandchild of child.children) {
      createPolygon(grandchild, results);
    }
  }
}

function addRing(
  ring: LinearRing,
  tolerance: Tolerance,
  builders: PolygonBuilder[],
) {
  for (const builder of builders) {
    const relation = ring.relate(builder.shell, tolerance);
    if (relation & A_INSIDE_B) {
      addRing(ring, tolerance, builder.children);
      return;
    }
    // We don't need an else B inside A here because linear rings are always found from the outside in
  }
  builders.push({
    shell: ring,
    children: [],
  });
}

export function comparePolygonsForSort(a: Polygon, b: Polygon): number {
  let compare = compareLinearRingsForSort(a.shell, b.shell);
  if (compare) {
    return compare;
  }
  const ha = a.holes;
  const hb = b.holes;
  const length = Math.min(ha.length, hb.length);
  for (let i = 0; i < length; i++) {
    compare = compareLinearRingsForSort(ha[i], hb[i]);
    if (compare) {
      return compare;
    }
  }
  return ha.length - hb.length;
}
