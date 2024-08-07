import {
  AbstractGeometry,
  comparePolygonsForSort,
  Geometry,
  GeometryCollection,
  Point,
  Polygon,
  Rectangle,
  ringToWkt,
} from ".";
import { NUMBER_FORMATTER, NumberFormatter } from "../formatter";
import { GeoJsonMultiPolygon } from "../geoJson";
import { Mesh } from "../mesh/Mesh";
import { MeshPathWalker } from "../mesh/MeshPathWalker";
import { generalize } from "../mesh/op/generalize";
import { PathWalker } from "../path/PathWalker";
import { A_OUTSIDE_B, B_INSIDE_A, Relation, TOUCH } from "../Relation";
import { Tolerance } from "../Tolerance";
import { Transformer } from "../transformer/Transformer";
import { RectangleBuilder } from "./builder/RectangleBuilder";
import { EmptyError } from "./EmptyError";

export class MultiPolygon extends AbstractGeometry {
  readonly polygons: ReadonlyArray<Polygon>;

  constructor(polygons: ReadonlyArray<Polygon>) {
    super();
    if (!polygons.length) {
      throw new EmptyError();
    }
    this.polygons = polygons;
  }
  static fromMesh(mesh: Mesh): MultiPolygon | null {
    const polygons = Polygon.fromMesh(mesh);
    return polygons.length ? new MultiPolygon(polygons) : null;
  }
  protected calculateCentroid(): Point {
    return this.getBounds().getCentroid();
  }
  isNormalized(): boolean {
    const { polygons } = this;
    if (polygons.find((polygon) => !polygon.isNormalized())) {
      return false;
    }
    for (let i = polygons.length - 2; i >= 0; i--) {
      if (comparePolygonsForSort(polygons[i], polygons[i + 1]) > 0) {
        return false;
      }
    }
    return true;
  }
  protected calculateBounds(): Rectangle {
    const builder = new RectangleBuilder();
    for (const lineString of this.polygons) {
      builder.unionRectangle(lineString.getBounds());
    }
    return builder.build() as Rectangle;
  }
  protected calculateNormalized(): MultiPolygon | Polygon {
    const polygons = this.polygons.map(
      (polygon) => polygon.normalize() as Polygon,
    );
    polygons.sort(comparePolygonsForSort);
    if (polygons.length === 1) {
      return polygons[0];
    }
    return new MultiPolygon(polygons);
  }
  walkPath(pathWalker: PathWalker): void {
    for (const polygon of this.polygons) {
      polygon.walkPath(pathWalker);
    }
  }
  toWkt(numberFormatter: NumberFormatter = NUMBER_FORMATTER): string {
    const result = ["MULTIPOLYGON("];
    for (const polygon of this.polygons) {
      result.push("(");
      ringToWkt(polygon.shell.coordinates, numberFormatter, false, result);
      for (const hole of polygon.holes) {
        result.push(",");
        ringToWkt(hole.coordinates, numberFormatter, true, result);
      }
      result.push("),");
    }
    result.pop();
    result.push("))");
    return result.join("");
  }
  toGeoJson(): GeoJsonMultiPolygon {
    const coordinates = [];
    for (const polygon of this.polygons) {
      coordinates.push(polygon.toGeoJson().coordinates);
    }
    return {
      type: "MultiPolygon",
      coordinates,
    };
  }
  isValid(tolerance: Tolerance): boolean {
    const { polygons } = this;
    if (polygons.find((polygon) => !polygon.isValid(tolerance))) {
      return false;
    }
    const walker = MeshPathWalker.valueOf(tolerance);
    this.walkPath(walker);
    const [mesh] = walker.getMeshes();
    return mesh.forEachVertexAndLinkCentroid((x, y) => {
      for (const polygon of polygons) {
        if (polygon.relatePoint(x, y, tolerance) === B_INSIDE_A) {
          return false;
        }
      }
      return true;
    });
  }
  transform(transformer: Transformer): MultiPolygon {
    return new MultiPolygon(
      this.polygons.map((polygon) => polygon.transform(transformer)),
    );
  }
  generalize(tolerance: Tolerance): Geometry {
    if (this.getBounds().isCollapsible(tolerance)) {
      return this.getCentroid();
    }
    const walker = MeshPathWalker.valueOf(tolerance);
    this.walkPath(walker);
    const [rings, linesAndPoints] = walker.getMeshes();
    generalize(rings, tolerance);
    return GeometryCollection.fromMeshes(rings, linesAndPoints).normalize();
  }
  relatePoint(x: number, y: number, tolerance: Tolerance): Relation {
    let inside = false;
    let result = A_OUTSIDE_B;
    for (const polygon of this.polygons) {
      const relation = polygon.relatePoint(x, y, tolerance);
      result |= relation & TOUCH;
      if (relation & B_INSIDE_A) {
        inside = !inside;
      }
    }
    if (inside) {
      result |= B_INSIDE_A;
    }
    return result;
  }
}
