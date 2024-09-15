import * as chai from "chai";
import { LineSegment, LineString, Point, Rectangle } from "../geom";
import { Tolerance } from "../Tolerance";
import { InvalidCoordinateError } from "../coordinate";
import { AffineTransformer } from "../transformer/AffineTransformer";
import { A_OUTSIDE_B, B_OUTSIDE_A, TOUCH } from "../Relation";

const expect = chai.expect;
const TOLERANCE = new Tolerance(0.1);

export const lineStringSpec = () => {
  it("constructor requires at least 2 coordinates", () => {
    expect(() => {
      new LineString([]);
    }).to.throw(InvalidCoordinateError);
    expect(() => {
      new LineString([1, 2]);
    }).to.throw(InvalidCoordinateError);
  });
  it("constructor requires an even number of coordinates", () => {
    expect(() => {
      new LineString([1, 2, 3]);
    }).to.throw(InvalidCoordinateError);
  });
  it("constructor coordinates must not be infinite", () => {
    expect(() => {
      new LineString([1, 2, 3, Infinity]);
    }).to.throw(InvalidCoordinateError);
  });
  it("constructor coordinates must not be NaN", () => {
    expect(() => {
      new LineString([1, 2, NaN, 3]);
    }).to.throw(InvalidCoordinateError);
  });
  it("getCentroid returns and caches the centroid", () => {
    const lineString = new LineString([0, 0, 2, 0, 2, 3, 0, 3]);
    const centroid = lineString.getCentroid();
    expect(centroid.toWkt()).to.equal("POINT(1 1.5)");
    expect(lineString.getCentroid()).to.equal(centroid);
  });
  it("returns the length and centroid", () => {
    const lineString = new LineString([
      0, 0, 10, 0, 10, 2, 2, 2, 2, 8, 10, 8, 10, 10, 0, 10, 0, 0,
    ]);
    expect(lineString.getLength()).to.equal(56);
    expect(lineString.getLength()).to.equal(56);
    expect(lineString.getCentroid().toWkt()).to.equal("POINT(4.1 5)");
  });
  it("returns GeoJson", () => {
    const lineString = new LineString([
      0, 0, 10, 0, 10, 2, 2, 2, 2, 8, 10, 8, 10, 10, 0, 10, 0, 0,
    ]);
    expect(lineString.toGeoJson()).to.eql({
      type: "LineString",
      coordinates: [
        [0, 0],
        [10, 0],
        [10, 2],
        [2, 2],
        [2, 8],
        [10, 8],
        [10, 10],
        [0, 10],
        [0, 0],
      ],
    });
  });
  it("validates successfully", () => {
    const lineString = new LineString([
      0, 0, 10, 0, 10, 2, 2, 2, 2, 8, 10, 8, 10, 10, 0, 10, 0, 0,
    ]);
    expect(lineString.isValid(TOLERANCE)).to.equal(true);
    expect(lineString.isValid(new Tolerance(2.1))).to.equal(false);
    expect(lineString.isValid(new Tolerance(11))).to.equal(false);
  });
  it("transforms successfully", () => {
    const lineString = new LineString([
      0, 0, 10, 0, 10, 2, 2, 2, 2, 8, 10, 8, 10, 10, 0, 10, 0, 0,
    ]);
    const transformed = lineString.transform(
      AffineTransformer.IDENTITY.scale(10),
    );
    expect(transformed.toWkt()).to.equal(
      "LINESTRING(0 0, 0 100, 100 100, 100 80, 20 80, 20 20, 100 20, 100 0, 0 0)",
    );
  });

  it("generalizes successfully", () => {
    const lineString = new LineString([
      0, 0, 5, 0.5, 10, 0, 10, 2, 5, 2.5, 2, 2, 2.5, 5, 2, 8, 5, 7.5, 10, 8, 10,
      10, 5, 10.5, 0, 10, 0.5, 5, 0, 0,
    ]);
    const generalized = lineString.generalize(new Tolerance(1));
    expect(generalized.toWkt()).to.equal(
      "LINESTRING(0 0, 10 0, 10 2, 2 2, 2 8, 10 8, 10 10, 0 10, 0 0)",
    );
    expect(lineString.generalize(new Tolerance(11)).toWkt()).to.equal(
      "POINT(4.3 5.5)",
    );
    expect(lineString.generalize(new Tolerance(0.01))).to.equal(lineString);
  });

  it("relates to line segments", () => {
    const lineString = new LineString([20, 0, 20, 40, 60, 20]);
    const lineSegment = new LineSegment(0, 0, 80, 80);
    expect(lineString.relate(lineSegment, TOLERANCE)).to.equal(
      A_OUTSIDE_B | B_OUTSIDE_A | TOUCH,
    );
  });

  it("unions successfully", () => {
    expect(
      new LineString([0, 0, 0, 100, 100, 100])
        .union(new LineString([0, 100, 100, 100, 100, 0]), TOLERANCE)
        .toWkt(),
    ).to.equal("LINESTRING(0 0, 0 100, 100 100, 100 0)");
    expect(
      new LineString([0, 0, 0, 100, 100, 100])
        .union(new Rectangle(0, 0, 100, 100), TOLERANCE)
        .toWkt(),
    ).to.equal(
      "POLYGON((0 0, 100 0, 100 100, 0 100, 0 0))",
    );
    expect(
      new LineString([0, 0, 0, 100, 100, 100])
        .union(new Rectangle(10, 10, 90, 90), TOLERANCE)
        .toWkt(),
    ).to.equal(
      "GEOMETRYCOLLECTION(POLYGON((10 10, 90 10, 90 90, 10 90, 10 10)),LINESTRING(0 0, 0 100, 100 100))",
    );
  });
  it("intersections successfully", () => {
    expect(
      new LineString([0, 0, 0, 100, 100, 100])
        .intersection(new LineString([0, 100, 100, 100, 100, 0]), TOLERANCE)
        .toWkt(),
    ).to.equal("LINESTRING(0 100, 100 100)");
    expect(
      new LineString([0, 0, 0, 100, 100, 100])
        .intersection(new Rectangle(0, 0, 100, 100), TOLERANCE)
        .toWkt(),
    ).to.equal("LINESTRING(0 0, 0 100, 100 100)");
    expect(
      new LineString([0, 0, 0, 100, 100, 100]).intersection(
        new Rectangle(10, 10, 90, 90),
        TOLERANCE,
      ),
    ).to.equal(null);
    expect(
      new LineString([0, 0, 0, 100, 100, 100]).intersection(
        new Rectangle(110, 10, 190, 90),
        TOLERANCE,
      ),
    ).to.equal(null);
    expect(
      new LineString([0, 0, 0, 100, 90, 100, 90, 0])
        .intersection(new Rectangle(10, 10, 100, 110), TOLERANCE)
        .toWkt(),
    ).to.equal("LINESTRING(10 100, 90 100, 90 10)");
    expect(
      new LineString([0, 0, 0, 100, 100, 100])
        .intersection(Point.valueOf(0, 50), TOLERANCE)
        .toWkt(),
    ).to.equal("POINT(0 50)");
    expect(
      new LineString([0, 0, 0, 100, 100, 100])
        .intersection(Point.valueOf(0, 100), TOLERANCE)
        .toWkt(),
    ).to.equal("POINT(0 100)");
    expect(
      new LineString([0, 0, 0, 100, 90, 100, 90, 0])
        .intersection(new Rectangle(10, 10, 100, 110), TOLERANCE)
        .toWkt(),
    ).to.equal("LINESTRING(10 100, 90 100, 90 10)");
  });
  it("less successfully", () => {
    const lineString = new LineString([0, 0, 0, 100, 100, 100]);
    expect(
      lineString
        .less(new LineString([0, 100, 100, 100, 100, 0]), TOLERANCE)
        .toWkt(),
    ).to.equal("LINESTRING(0 0, 0 100)");
    expect(lineString.less(new Rectangle(0, 0, 100, 100), TOLERANCE)).to.equal(
      null,
    );
    expect(
      lineString.less(new Rectangle(10, 10, 90, 90), TOLERANCE).toWkt(),
    ).to.equal("LINESTRING(0 0, 0 100, 100 100)");
    expect(
      lineString.less(new Rectangle(110, 10, 190, 90), TOLERANCE).toWkt(),
    ).to.equal("LINESTRING(0 0, 0 100, 100 100)");
    expect(
      new LineString([0, 0, 0, 100, 90, 100, 90, 0])
        .less(new Rectangle(10, 10, 100, 110), TOLERANCE)
        .toWkt(),
    ).to.equal("MULTILINESTRING((0 0, 0 100, 10 100),(90 0, 90 10))");
  });
  it("xor successfully", () => {
    const lineString = new LineString([0, 0, 0, 100, 100, 100]);
    expect(
      lineString
        .xor(new LineString([0, 100, 100, 100, 100, 0]), TOLERANCE)
        .toWkt(),
    ).to.equal("MULTILINESTRING((0 0, 0 100),(100 0, 100 100))");
    expect(lineString.xor(new Rectangle(0, 0, 100, 100), TOLERANCE)).to.equal(
      null,
    );
    expect(
      lineString.xor(new Rectangle(10, 10, 90, 90), TOLERANCE).toWkt(),
    ).to.equal(
      "GEOMETRYCOLLECTION(POLYGON((10 10, 90 10, 90 90, 10 90, 10 10)),LINESTRING(0 0, 0 100, 100 100))",
    );
    expect(
      new LineString([0, 0, 0, 100, 90, 100, 90, 0])
        .xor(new Rectangle(10, 10, 100, 110), TOLERANCE)
        .toWkt(),
    ).to.equal(
      "GEOMETRYCOLLECTION(POLYGON((10 10, 90 10, 100 10, 100 110, 10 110, 10 100, 10 10)),LINESTRING(0 0, 0 100, 10 100),LINESTRING(90 0, 90 10))",
    );
  });
};
