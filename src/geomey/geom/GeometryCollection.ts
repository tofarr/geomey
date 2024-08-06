import { DISJOINT, Relation, TOUCH, UNKNOWN } from "../Relation";
import { Tolerance } from "../Tolerance";
import { forEachCoordinate } from "../coordinate";
import { NUMBER_FORMATTER, NumberFormatter } from "../formatter";
import { GeoJsonGeometryCollection } from "../geoJson";
import { Mesh } from "../mesh/Mesh";
import { MeshPathWalker } from "../mesh/MeshPathWalker";
import { generalize } from "../mesh/op/generalize";
import { PathWalker } from "../path/PathWalker";
import { Transformer } from "../transformer/Transformer";
import {
  AbstractGeometry,
  Geometry,
  Rectangle,
  Point,
  pointToWkt,
  MultiPoint,
  MultiLineString,
  MultiPolygon,
} from ".";
import { RectangleBuilder } from "./builder/RectangleBuilder";
import { EmptyError } from "./EmptyError";

/**
 * Polygons of a multi geometry are expected to NOT overlap
 */
export class GeometryCollection extends AbstractGeometry {
  points?: MultiPoint;
  lineStrings?: MultiLineString;
  polygons?: MultiPolygon;

  constructor(
    points?: MultiPoint,
    lineStrings?: MultiLineString,
    polygons?: MultiPolygon,
  ) {
    super();
    if (!points && !lineStrings && !polygons) {
      throw new EmptyError();
    }
    this.points = points;
    this.lineStrings = lineStrings;
    this.polygons = polygons;
  }
  static fromMeshes(
    rings: Mesh,
    linesAndPoints: Mesh,
  ): GeometryCollection | null {
    const multiPoint = MultiPoint.fromMesh(linesAndPoints);
    const multiLineString = MultiLineString.fromMesh(linesAndPoints);
    const multiPolygon = MultiPolygon.fromMesh(rings);
    if (multiPoint || multiLineString || multiPolygon) {
      return new GeometryCollection(multiPoint, multiLineString, multiPolygon);
    }
  }
  protected calculateCentroid(): Point {
    return this.getBounds().getCentroid();
  }
  protected calculateBounds(): Rectangle {
    let { points, lineStrings, polygons } = this;
    const builder = new RectangleBuilder();
    if (points) {
      builder.unionRectangle(points.getBounds());
    }
    if (lineStrings) {
      builder.unionRectangle(lineStrings.getBounds());
    }
    if (polygons) {
      builder.unionRectangle(polygons.getBounds());
    }
    return builder.build() as Rectangle;
  }
  walkPath(pathWalker: PathWalker): void {
    let { points, lineStrings, polygons } = this;
    if (polygons) {
      polygons.walkPath(pathWalker);
    }
    if (lineStrings) {
      lineStrings.walkPath(pathWalker);
    }
    if (points) {
      points.walkPath(pathWalker);
    }
  }
  toWkt(numberFormatter: NumberFormatter = NUMBER_FORMATTER): string {
    const { points, lineStrings, polygons } = this;
    const results = ["GEOMETRYCOLLECTION ("];
    if (polygons) {
      for (const polygon of polygons.polygons) {
        results.push(polygon.toWkt(numberFormatter));
      }
    }
    if (lineStrings) {
      for (const lineString of lineStrings.lineStrings) {
        results.push(lineString.toWkt(numberFormatter));
      }
    }
    forEachCoordinate(points.coordinates, (x, y) => {
      results.push(pointToWkt(x, y, numberFormatter), ", ");
    });
    results.pop();
    results.push(")");
    return results.join("");
  }
  toGeoJson(): GeoJsonGeometryCollection {
    const geometries = [];
    forEachCoordinate(this.points.coordinates, (x, y) => {
      geometries.push({
        type: "Point",
        x,
        y,
      });
    });
    for (const lineString of this.lineStrings.lineStrings) {
      geometries.push(lineString.toGeoJson());
    }
    for (const polygon of this.polygons.polygons) {
      geometries.push(polygon.toGeoJson());
    }
    return {
      type: "GeometryCollection",
      geometries,
    };
  }
  isNormalized(): boolean {
    const { points, lineStrings, polygons } = this;
    if (points && !points.isNormalized()) {
      return false;
    }
    if (lineStrings && !lineStrings.isNormalized()) {
      return false;
    }
    if (polygons && !polygons.isNormalized()) {
      return false;
    }
    return true;
  }
  calculateNormalized(): Geometry {
    let { points, lineStrings, polygons } = this;
    if ((points ? 1 : 0) + (lineStrings ? 1 : 0) + (polygons ? 1 : 0) === 1) {
      return (points || lineStrings || polygons).normalize();
    }
    if (points && points.coordinates.length > 2) {
      points = points.normalize() as MultiPoint;
    }
    if (lineStrings && lineStrings.lineStrings.length > 2) {
      lineStrings = lineStrings.normalize() as MultiLineString;
    }
    if (polygons && polygons.polygons.length > 2) {
      polygons = polygons.normalize() as MultiPolygon;
    }
    return new GeometryCollection(points, lineStrings, polygons);
  }
  isValid(tolerance: Tolerance): boolean {
    let { points, lineStrings, polygons } = this;
    if (points && !points.isValid(tolerance)) {
      return false;
    }
    if (lineStrings && !lineStrings.isValid(tolerance)) {
      return false;
    }
    if (polygons && !polygons.isValid(tolerance)) {
      return false;
    }
    return true;
  }
  transform(transformer: Transformer): Geometry {
    let { points, lineStrings, polygons } = this;
    if (points) {
      points = points.transform(transformer);
    }
    if (lineStrings) {
      lineStrings = lineStrings.transform(transformer);
    }
    if (polygons) {
      polygons = polygons.transform(transformer);
    }
    return new GeometryCollection(points, lineStrings, polygons);
  }
  generalize(tolerance: Tolerance): Geometry {
    const pathWalker = MeshPathWalker.valueOf(tolerance);
    this.walkPath(pathWalker);
    const [rings, linesAndPoints] = pathWalker.getMeshes();
    generalize(rings, tolerance);
    generalize(linesAndPoints, tolerance);
    return GeometryCollection.fromMeshes(rings, linesAndPoints);
  }
  relatePoint(x: number, y: number, tolerance: Tolerance): Relation {
    if (this.getBounds().relatePoint(x, y, tolerance) == DISJOINT) {
      return DISJOINT;
    }
    let { points, lineStrings, polygons } = this;
    let relation = UNKNOWN;
    if (points) {
      relation = points.relatePoint(x, y, tolerance);
    }
    if (lineStrings) {
      relation |= lineStrings.relatePoint(x, y, tolerance);
    }
    if (polygons) {
      relation |= polygons.relatePoint(x, y, tolerance);
    }
    return relation;
  }
}
