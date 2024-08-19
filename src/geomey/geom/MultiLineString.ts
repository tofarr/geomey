import {
  AbstractGeometry,
  compareLineStringsForSort,
  coordinatesToWkt,
  GeometryCollection,
  LineString,
  Point,
  Rectangle,
} from ".";
import { forEachCoordinate } from "../coordinate";
import { NUMBER_FORMATTER, NumberFormatter } from "../formatter";
import { GeoJsonMultiLineString } from "../geoJson";
import { Mesh } from "../mesh/Mesh";
import { MeshPathWalker } from "../mesh/MeshPathWalker";
import { generalize } from "../mesh/op/generalize";
import { PathWalker } from "../path/PathWalker";
import { DISJOINT, Relation } from "../Relation";
import { Tolerance } from "../Tolerance";
import { Transformer } from "../transformer/Transformer";
import { RectangleBuilder } from "./builder/RectangleBuilder";
import { EmptyError } from "./EmptyError";

export class MultiLineString extends AbstractGeometry {
  readonly lineStrings: ReadonlyArray<LineString>;

  constructor(lineStrings: ReadonlyArray<LineString>) {
    super();
    if (!lineStrings.length) {
      throw new EmptyError();
    }
    this.lineStrings = lineStrings;
  }
  static fromMesh(mesh: Mesh): MultiLineString | null {
    const lineStrings = LineString.fromMesh(mesh);
    return lineStrings.length ? new MultiLineString(lineStrings) : null;
  }
  protected calculateCentroid(): Point {
    return this.getBounds().getCentroid();
  }
  protected calculateBounds(): Rectangle {
    const builder = new RectangleBuilder();
    for (const lineString of this.lineStrings) {
      builder.unionRectangle(lineString.getBounds());
    }
    return builder.build() as Rectangle;
  }
  isNormalized(): boolean {
    const { lineStrings } = this;
    if (lineStrings.find((lineString) => !lineString.isNormalized())) {
      return false;
    }
    if (lineStrings.length == 1) {
      return false;
    }
    for (let i = lineStrings.length - 2; i >= 0; i--) {
      if (compareLineStringsForSort(lineStrings[i], lineStrings[i + 1]) > 0) {
        return false;
      }
    }
    return true;
  }
  protected calculateNormalized(): LineString | MultiLineString {
    if (this.isNormalized()) {
      return this;
    }
    const lineStrings = this.lineStrings.map(
      (lineString) => lineString.normalize() as LineString,
    );
    if (lineStrings.length === 1) {
      return lineStrings[0];
    }
    lineStrings.sort(compareLineStringsForSort);
    return new MultiLineString(lineStrings);
  }
  walkPath(pathWalker: PathWalker): void {
    for (const lineString of this.lineStrings) {
      lineString.walkPath(pathWalker);
    }
  }
  toWkt(numberFormatter: NumberFormatter = NUMBER_FORMATTER): string {
    const result = ["MULTILINESTRING("];
    for (const lineString of this.lineStrings) {
      coordinatesToWkt(lineString.coordinates, numberFormatter, result);
      result.push(",");
    }
    result.pop();
    result.push(")");
    return result.join("");
  }
  toGeoJson(): GeoJsonMultiLineString {
    const coordinates = this.lineStrings.map((lineString) => {
      const c = [];
      forEachCoordinate(lineString.coordinates, (x, y) => {
        c.push([x, y]);
      });
      return c;
    });
    return {
      type: "MultiLineString",
      coordinates,
    };
  }
  isValid(tolerance: Tolerance): boolean {
    return !this.lineStrings.find(
      (lineString) => !lineString.isValid(tolerance),
    );
  }
  transform(transformer: Transformer): MultiLineString {
    return new MultiLineString(
      this.lineStrings.map((lineString) => lineString.transform(transformer)),
    );
  }
  generalize(tolerance: Tolerance): LineString | MultiLineString | Point {
    if (this.getBounds().isCollapsible(tolerance)) {
      return this.getCentroid();
    }
    const walker = MeshPathWalker.valueOf(tolerance);
    this.walkPath(walker);
    const [rings, linesAndPoints] = walker.getMeshes();
    generalize(linesAndPoints, tolerance);
    return GeometryCollection.fromMeshes(rings, linesAndPoints).normalize() as
      | LineString
      | MultiLineString
      | Point;
  }
  relatePoint(x: number, y: number, tolerance: Tolerance): Relation {
    for (const lineString of this.lineStrings) {
      const relation = lineString.relatePoint(x, y, tolerance);
      if (relation !== DISJOINT) {
        return relation;
      }
    }
    return DISJOINT;
  }
}
