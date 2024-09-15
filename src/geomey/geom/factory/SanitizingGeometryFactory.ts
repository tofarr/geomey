import { GeometryFactory } from ".";
import {
  Coordinates,
  forEachCoordinate,
  forEachLineSegmentCoordinates,
} from "../../coordinate";
import { Mesh } from "../../mesh/Mesh";
import { Tolerance } from "../../Tolerance";
import {
  Geometry,
  GeometryCollection,
  LineString,
  MultiLineString,
  MultiPoint,
  Point,
} from "..";
import { MeshPathWalker } from "../../mesh/MeshPathWalker";
import { DefaultGeometryFactory } from "./DefaultGeometryFactory";

export class SanitizingGeometryFactory implements GeometryFactory {
  readonly tolerance: Tolerance;
  readonly factory: GeometryFactory;

  constructor(tolerance: Tolerance, factory?: GeometryFactory) {
    this.tolerance = tolerance;
    this.factory = factory || new DefaultGeometryFactory();
  }
  createPoint(x: number, y: number): Point {
    const { tolerance } = this;
    return Point.valueOf(tolerance.normalize(x), tolerance.normalize(y));
  }
  createMultiPoint(points: Coordinates): Geometry {
    const mesh = new Mesh(this.tolerance);
    forEachCoordinate(points, (x, y) => {
      mesh.addPoint(x, y);
    });
    const coordinates = mesh.getCoordinates();
    return new MultiPoint(coordinates).normalize();
  }
  createLineString(coordinates: Coordinates): Geometry {
    const mesh = new Mesh(this.tolerance);
    addLineStringToMesh(coordinates, mesh);
    const lineStrings = mesh
      .getLineStrings()
      .map((coordinates) => new LineString(coordinates));
    return new MultiLineString(lineStrings).normalize();
  }
  createMultiLineString(lineStrings: ReadonlyArray<Coordinates>): Geometry {
    const mesh = new Mesh(this.tolerance);
    addLineStringsToMesh(lineStrings, mesh);
    const normalizedLineStrings = mesh
      .getLineStrings()
      .map((coordinates) => new LineString(coordinates));
    return new MultiLineString(normalizedLineStrings).normalize();
  }
  createPolygon(
    shell: Coordinates,
    holes?: ReadonlyArray<Coordinates>,
  ): Geometry {
    const unsanitized = this.factory.createPolygon(shell, holes);
    return this.sanitize(unsanitized);
  }
  createMultiPolygon(
    polygons: ReadonlyArray<ReadonlyArray<Coordinates>>,
  ): Geometry {
    const unsanitized = this.factory.createMultiPolygon(polygons);
    return this.sanitize(unsanitized);
  }
  createGeometryCollection(
    points?: Coordinates,
    lineStrings?: ReadonlyArray<Coordinates>,
    polygons?: ReadonlyArray<ReadonlyArray<Coordinates>>,
  ): Geometry {
    const unsanitized = this.factory.createGeometryCollection(
      points,
      lineStrings,
      polygons,
    );
    return this.sanitize(unsanitized);
  }

  sanitize(unsanitized: Geometry): Geometry {
    const pathWalker = MeshPathWalker.valueOf(this.tolerance, true);
    unsanitized.walkPath(pathWalker);
    const [rings, linesAndPoints] = pathWalker.getMeshes();
    return GeometryCollection.fromMeshes(rings, linesAndPoints).normalize();
  }
}

function addLineStringToMesh(lineString: Coordinates, mesh: Mesh) {
  forEachLineSegmentCoordinates(lineString, (ax, ay, bx, by) =>
    mesh.addLink(ax, ay, bx, by),
  );
}

function addLineStringsToMesh(
  lineStrings: ReadonlyArray<Coordinates>,
  mesh: Mesh,
) {
  for (const lineString of lineStrings) {
    addLineStringToMesh(lineString, mesh);
  }
}
