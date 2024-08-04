import * as chai from "chai";
import { parseWkt } from "./WktParser";
import { Tolerance } from "../Tolerance";

const expect = chai.expect;

export const wktSpec = () => {
  it("parses and renders a point", () => {
    const wkt = "POINT (12 34)";
    const parsed = parseWkt(wkt);
    const rendered = parsed.toWkt();
    expect(rendered).to.equal(wkt);
  });

  it("parses and renders a multipoint", () => {
    const wkt = "POINT (12 34)";
    const parsed = parseWkt(wkt);
    const rendered = parsed.toWkt();
    expect(rendered).to.equal(wkt);
  });

  it("parses and renders an unvalidated linestring", () => {
    const wkt = "LINESTRING (0 0, 100 0, 100 100, 0 100)";
    const parsed = parseWkt(wkt);
    const rendered = parsed.toWkt();
    expect(rendered).to.equal(wkt);
  });

  it("parses and renders an unvalidated self intersecting linestring", () => {
    const wkt = "LINESTRING (0 50, 100 50, 100 100, 50 100, 50 0)";
    const parsed = parseWkt(wkt);
    const rendered = parsed.toWkt();
    expect(rendered).to.equal(wkt);
  });

  it("parses and renders a validated self intersecting linestring", () => {
    const wkt = "LINESTRING (0 50, 100 50, 100 100, 50 100, 50 0)";
    const parsed = parseWkt(wkt, new Tolerance(0.05));
    const rendered = parsed.toWkt();
    expect(rendered).to.equal(
      "MULTILINESTRING ((0 50, 50 50), (50 0, 50 50), (50 50, 100 50, 100 100, 50 100, 50 50))",
    );
  });

  it("parses and renders an unvalidated polygon", () => {
    const wkt = "POLYGON ((0 0, 100 0, 100 100, 0 100, 0 0))";
    const parsed = parseWkt(wkt);
    const rendered = parsed.toWkt();
    expect(rendered).to.equal("POLYGON ((0 0, 100 0, 100 100, 0 100, 0 0))");
  });

  it("parses and renders a validated self intersecting polygon", () => {
    // Self intersecting polygon is broken into 2 polygons
    const wkt = "POLYGON ((0 0, 100 0, 0 100, 100 100, 0 0))";
    const parsed = parseWkt(wkt, new Tolerance(0.05));
    const rendered = parsed.toWkt();
    expect(rendered).to.equal("MULTIPOLYGON ((0 0, 100 0, 50 50, 0 0), (0 100, 50 50, 100 100, 0 100))");
  });

  it("parses and renders a geometry collection", () => {
    const wkt = "GEOMETRYCOLLECTION (POLYGON((0 0, 100 0, 0 100, 0 0)), POINT(100 100), LINESTRING(200 0, 200 100, 300 100))";
    const parsed = parseWkt(wkt, new Tolerance(0.05));
    const rendered = parsed.toWkt();
    expect(rendered).to.equal("GEOMETRYCOLLECTION (POLYGON ((0 0, 100 0, 0 100, 0 0)), LINESTRING (200 0, 200 100, 300 100), POINT (100 100))");
  });

  foo = "Need to test with missing ( and ) or an uneven number of coordinates or a NaN"
};
