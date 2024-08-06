import { GeometryFactory } from ".";
import {
  Coordinates,
  forEachCoordinate,
  forEachLineSegmentCoordinates,
} from "../../coordinate";
import { Mesh } from "../../mesh/Mesh";
import { Tolerance } from "../../Tolerance";
import {
  createGeometryCollection,
  createPolygons,
  Geometry,
  GeometryCollection,
  LineString,
  Point,
} from "../";

export class ValidatingGeometryFactory implements GeometryFactory {
  readonly tolerance: Tolerance;

  createPoint(x: number, y: number): Point {
    const { tolerance } = this;
    return Point.valueOf(tolerance.normalize(x), tolerance.normalize(y));
  }
  createMultiPoint(points: Coordinates): Geometry {
    const mesh = new Mesh(this.tolerance);
    forEachCoordinate(points, (x, y) => {
      mesh.addVertex(x, y);
    });
    const coordinates = mesh.getCoordinates();
    return GeometryCollection.unsafeValueOf(coordinates).simplify();
  }
  createLineString(coordinates: Coordinates): Geometry {
    const mesh = new Mesh(this.tolerance);
    addLineStringToMesh(coordinates, mesh);
    const lineStrings = mesh
      .getLineStrings()
      .map((coordinates) => LineString.unsafeValueOf(coordinates));
    return GeometryCollection.unsafeValueOf(undefined, lineStrings).simplify();
  }
  createMultiLineString(lineStrings: ReadonlyArray<Coordinates>): Geometry {
    const mesh = new Mesh(this.tolerance);
    addLineStringsToMesh(lineStrings, mesh);
    const normalizedLineStrings = mesh
      .getLineStrings()
      .map((coordinates) => LineString.unsafeValueOf(coordinates));
    return GeometryCollection.unsafeValueOf(
      undefined,
      normalizedLineStrings,
    ).simplify();
  }
  createPolygon(
    shell: Coordinates,
    holes?: ReadonlyArray<Coordinates>,
  ): Geometry {
    const mesh = new Mesh(this.tolerance);
    addLineStringToMesh(shell, mesh);
    if (holes) {
      addLineStringsToMesh(holes, mesh);
    }
    const polygons = createPolygons(mesh);
    return GeometryCollection.unsafeValueOf([], [], polygons).simplify();
  }
  createMultiPolygon(
    polygons: ReadonlyArray<ReadonlyArray<Coordinates>>,
  ): Geometry {
    const mesh = new Mesh(this.tolerance);
    for (const polygon of polygons) {
      addLineStringsToMesh(polygon, mesh);
    }
    const normalizedPolygons = createPolygons(mesh);
    return GeometryCollection.unsafeValueOf(
      [],
      [],
      normalizedPolygons,
    ).simplify();
  }
  createGeometryCollection(
    points?: Coordinates,
    lineStrings?: ReadonlyArray<Coordinates>,
    polygons?: ReadonlyArray<ReadonlyArray<Coordinates>>,
  ): Geometry {
    const linesAndPoints = new Mesh(this.tolerance);
    if (points) {
      forEachCoordinate(points, (x, y) => {
        linesAndPoints.addVertex(x, y);
      });
    }
    if (lineStrings) {
      addLineStringsToMesh(lineStrings, linesAndPoints);
    }
    if (polygons) {
      for (const polygon of polygons) {
        addLineStringsToMesh(polygon, linesAndPoints);
      }
    }
    const rings = new Mesh(this.tolerance);
    for (const polygon of polygons) {
      addLineStringsToMesh(polygon, rings);
    }
    return createGeometryCollection(rings, linesAndPoints).simplify();
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
