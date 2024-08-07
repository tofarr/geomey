import { Geometry } from "../geom";
import { GeometryFactory } from "../geom/factory";
import { DefaultGeometryFactory } from "../geom/factory/DefaultGeometryFactory";
import { SanitizingGeometryFactory } from "../geom/factory/SanitizingGeometryFactory";
import { Tolerance } from "../Tolerance";

export class InvalidWktError extends Error {
  constructor(wkt: string) {
    super(wkt);
  }
}

export function parseWkt(input: string, tolerance?: Tolerance) {
  const parser = new WktParser(
    tolerance
      ? new SanitizingGeometryFactory(tolerance)
      : new DefaultGeometryFactory(),
  );
  return parser.parse(input);
}

export class WktParser {
  private factory: GeometryFactory;

  constructor(factory?: GeometryFactory) {
    this.factory = factory || new DefaultGeometryFactory();
  }
  parse(input: string): Geometry {
    input = normalizeWkt(input);
    const parsed = this.parseInternal(input, 0);
    return parsed[0];
  }
  parseInternal(input: string, position: number): [Geometry, number] {
    const [type, start] = parseType(input, position);
    switch (type) {
      case "point":
        return this.parsePoint(input, start);
      case "multipoint":
        return this.parseMultiPoint(input, start);
      case "linestring":
        return this.parseLineString(input, start);
      case "multilinestring":
        return this.parseMultiLineString(input, start);
      case "polygon":
        return this.parsePolygon(input, start);
      case "multipolygon":
        return this.parseMultiPolygon(input, start);
      case "geometrycollection":
        return this.parseGeometryCollection(input, start);
      default:
        throw new InvalidWktError(input);
    }
  }
  parsePoint(input: string, position: number): [Geometry, number] {
    const [coordinates, end] = parseCoordinates(input, position);
    if (coordinates.length != 2) {
      throw new InvalidWktError(input);
    }
    return [this.factory.createPoint(coordinates[0], coordinates[1]), end];
  }
  parseMultiPoint(input: string, position: number): [Geometry, number] {
    const [coordinates, end] = parseCoordinates(input, position);
    return [this.factory.createMultiPoint(coordinates), end];
  }
  parseLineString(input: string, position: number): [Geometry, number] {
    const [coordinates, end] = parseCoordinates(input, position);
    return [this.factory.createLineString(coordinates), end];
  }
  parseMultiLineString(input: string, position: number): [Geometry, number] {
    const [coordinateLists, end] = parseCoordinateLists(input, position);
    return [this.factory.createMultiLineString(coordinateLists), end];
  }
  parsePolygon(input: string, position: number): [Geometry, number] {
    const [coordinateLists, end] = parseCoordinateLists(input, position);
    return [
      this.factory.createPolygon(coordinateLists[0], coordinateLists.slice(1)),
      end,
    ];
  }
  parseMultiPolygon(input: string, position: number): [Geometry, number] {
    const nestedCoordinateLists = [];
    while (input[position] != ")") {
      const [coordinateLists, end] = parseCoordinateLists(input, position);
      nestedCoordinateLists.push(coordinateLists);
      position = end;
    }
    return [
      this.factory.createMultiPolygon(nestedCoordinateLists),
      position + 1,
    ];
  }
  parseGeometryCollection(input: string, position: number): [Geometry, number] {
    const points = [];
    const lineStrings = [];
    const polygons = [];
    while (input[position] != ")") {
      const [type, start] = parseType(input, position);
      switch (type) {
        case "point": {
          const [coordinates, end] = parseCoordinates(input, start);
          if (coordinates.length != 2) {
            throw new InvalidWktError(input);
          }
          points.push(...coordinates);
          position = end;
          break;
        }
        case "linestring": {
          const [coordinates, end] = parseCoordinates(input, start);
          lineStrings.push(coordinates);
          position = end;
          break;
        }
        case "polygon": {
          const [coordinateLists, end] = parseCoordinateLists(input, start);
          polygons.push(coordinateLists);
          position = end;
          break;
        }
        default:
          throw new InvalidWktError(input);
      }
    }
    return [
      this.factory.createGeometryCollection(points, lineStrings, polygons),
      position + 1,
    ];
  }
}

/**
 * Replace all commas with spaces, Make sure there is no duplicate whitespace, and
 * no leading or trialing whitespace before or after a brace.
 */
function normalizeWkt(input: string) {
  return input
    .replaceAll(",", " ")
    .replace(/\s\s+/g, " ")
    .replaceAll("( ", "(")
    .replaceAll(" (", "(")
    .replaceAll(") ", ")")
    .replaceAll(" )", ")")
    .trim();
}

function parseCoordinates(input: string, position: number): [number[], number] {
  const end = input.indexOf(")", position);
  const coordinates = input
    .substring(position, end)
    .split(" ")
    .map((n) => parseFloat(n));
  if (coordinates.length & 1) {
    throw new InvalidWktError(input)
  }
  return [coordinates, end + 1];
}

function parseCoordinateLists(
  input: string,
  position: number,
): [number[][], number] {
  const coordinateLists = [];
  while (input[position] === "(") {
    position++;
    const [coordinates, end] = parseCoordinates(input, position);
    coordinateLists.push(coordinates);
    position = end;
  }
  return [coordinateLists, position + 1];
}

function parseType(input: string, position: number): [string, number] {
  const newPosition = input.indexOf("(", position);
  return [
    input.substring(position, newPosition).toLowerCase(),
    newPosition + 1,
  ];
}
