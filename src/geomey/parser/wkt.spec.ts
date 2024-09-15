import * as chai from "chai";
import { InvalidWktError, parseWkt } from "./WktParser";
import { Tolerance } from "../Tolerance";
import { MeshError } from "../mesh/MeshError";
import { InvalidCoordinateError } from "../coordinate";

const expect = chai.expect;

export const wktSpec = () => {
  it("parses and renders a point", () => {
    const wkt = "POINT(12 34)";
    const parsed = parseWkt(wkt);
    const rendered = parsed.toWkt();
    expect(rendered).to.equal(wkt);
  });

  it("parses and renders a multipoint", () => {
    const wkt = "MULTIPOINT(12 34)";
    const parsed = parseWkt(wkt);
    const rendered = parsed.toWkt();
    expect(rendered).to.equal(wkt);
  });

  it("parses and renders an unsanitized linestring", () => {
    const wkt = "LINESTRING(0 0, 100 0, 100 100, 0 100)";
    const parsed = parseWkt(wkt);
    const rendered = parsed.toWkt();
    expect(rendered).to.equal(wkt);
  });

  it("parses and renders an unsanitized self intersecting linestring", () => {
    const wkt = "LINESTRING(0 50, 100 50, 100 100, 50 100, 50 0)";
    const parsed = parseWkt(wkt);
    const rendered = parsed.toWkt();
    expect(rendered).to.equal(wkt);
  });

  it("parses and renders a sanitized self intersecting linestring", () => {
    const wkt = "LINESTRING(0 50, 100 50, 100 100, 50 100, 50 0)";
    const parsed = parseWkt(wkt, new Tolerance(0.05));
    const rendered = parsed.toWkt();
    expect(rendered).to.equal(
      "MULTILINESTRING((0 50, 50 50),(50 0, 50 50),(50 50, 50 100, 100 100, 100 50, 50 50))",
    );
  });

  it("parses and renders a sanitized self intersecting multilinestring", () => {
    const wkt =
      "MULTILINESTRING((0 50, 50 50),(50 0, 50 50),(50 50, 50 100, 100 100, 100 50, 50 50))";
    const parsed = parseWkt(wkt, new Tolerance(0.05));
    const rendered = parsed.toWkt();
    expect(rendered).to.equal(
      "MULTILINESTRING((0 50, 50 50),(50 0, 50 50),(50 50, 50 100, 100 100, 100 50, 50 50))",
    );
  });

  it("parses and renders an unsanitized polygon", () => {
    const wkt = "POLYGON((0 0, 100 0, 100 100, 0 100, 0 0))";
    const parsed = parseWkt(wkt);
    const rendered = parsed.toWkt();
    expect(rendered).to.equal("POLYGON((0 0, 100 0, 100 100, 0 100, 0 0))");
  });

  it("parses and renders a sanitized self intersecting polygon", () => {
    // Self intersecting polygon is broken into 2 polygons
    const wkt = "POLYGON((0 0, 100 0, 0 100, 100 100, 0 0))";
    const parsed = parseWkt(wkt, new Tolerance(0.05));
    const rendered = parsed.toWkt();
    expect(rendered).to.equal(
      "MULTIPOLYGON(((0 0, 100 0, 50 50, 0 0)),((0 100, 50 50, 100 100, 0 100)))",
    );
  });

  it("parses and renders a sanitized polygon with a touching hole", () => {
    // Self intersecting polygon is broken into 3 polygons
    const wkt = "POLYGON((0 0, 200 0, 100 100),(100 0, 50 50, 150 50))";
    const parsed = parseWkt(wkt, new Tolerance(0.05));
    const rendered = parsed.toWkt();
    expect(rendered).to.equal(
      "MULTIPOLYGON(((0 0, 100 0, 50 50, 0 0)),((50 50, 150 50, 100 100, 50 50)),((100 0, 200 0, 150 50, 100 0)))",
    );
  });

  it("parses and renders an unsanitized multipolygon", () => {
    const wkt = "MULTIPOLYGON(((0 0, 100 0, 100 100, 0 100, 0 0)))";
    const parsed = parseWkt(wkt);
    const rendered = parsed.toWkt();
    expect(rendered).to.equal(
      "MULTIPOLYGON(((0 0, 100 0, 100 100, 0 100, 0 0)))",
    );
  });

  it("parses and renders a geometry collection", () => {
    const wkt =
      "GEOMETRYCOLLECTION(POLYGON((0 0, 100 0, 0 100, 0 0)), POINT(100 100), LINESTRING(200 0, 200 100, 300 100))";
    const parsed = parseWkt(wkt, new Tolerance(0.05));
    const rendered = parsed.toWkt();
    expect(rendered).to.equal(
      "GEOMETRYCOLLECTION(POLYGON((0 0, 100 0, 0 100, 0 0)),LINESTRING(200 0, 200 100, 300 100),POINT(100 100))",
    );
  });

  it("throws an error when there are is not the correct number of coordinates for a point", () => {
    expect(() => {
      parseWkt("POINT (1 2 3)", new Tolerance(0.05));
    }).to.throw(InvalidWktError);
  });

  it("throws an error when a point has an invalid ordinate", () => {
    expect(() => {
      parseWkt("POINT (1 a)", new Tolerance(0.05));
    }).to.throw(InvalidCoordinateError);
  });

  it("throws an error when a point has the wrong number of ordinates", () => {
    expect(() => {
      parseWkt("POINT (1 2, 3 4)", new Tolerance(0.05));
    }).to.throw(InvalidWktError);
    expect(() => {
      parseWkt(
        "GEOMETRYCOLLECTION(POLYGON((0 0, 100 0, 0 100, 0 0)), POINT(1 2, 3 4), LINESTRING(200 0, 200 100, 300 100))",
      );
    }).to.throw(InvalidWktError);
  });

  it("throws an error when a multipoint has an invalid ordinate", () => {
    expect(() => {
      parseWkt("MULTIPOINT (1 2, a, 4)", new Tolerance(0.05));
    }).to.throw(MeshError);
  });

  it("throws an error when there are an uneven number of coordinates", () => {
    expect(() => {
      parseWkt("LINESTRING (1 2, 3)", new Tolerance(0.05));
    }).to.throw(InvalidWktError);
  });

  it("throws an error when there are an unknown type", () => {
    expect(() => {
      parseWkt("UNKNOWN (1 2, 3 4)");
    }).to.throw(InvalidWktError);
    expect(() => {
      parseWkt(
        "GEOMETRYCOLLECTION(POLYGON((0 0, 100 0, 0 100, 0 0)), UNKNOWN (1 2, 3 4))",
      );
    }).to.throw(InvalidWktError);
  });
};
