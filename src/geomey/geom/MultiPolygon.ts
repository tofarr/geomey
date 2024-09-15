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
import { B_INSIDE_A, DISJOINT, Relation, TOUCH } from "../Relation";
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
    if (polygons.length === 1) {
      return false;
    }
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
    if (this.isNormalized()) {
      return this;
    }
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

    return mesh.forEachEdge(({ a, b }) => {
      const x = (a.x + b.x) / 2;
      const y = (a.y + b.y) / 2;
      let numTouches = 0;
      for (const polygon of polygons) {
        const polygonRelate = polygon.relatePoint(x, y, tolerance);
        if (polygonRelate & B_INSIDE_A) {
          return false;
        }
        if (polygonRelate & TOUCH) {
          numTouches++;
          if (numTouches > 1) {
            return false;
          }
        }
      }
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
    for (const polygon of this.polygons) {
      const relation = polygon.relatePoint(x, y, tolerance);
      if (relation != DISJOINT) {
        return relation;
      }
    }
    return DISJOINT;
  }
}
