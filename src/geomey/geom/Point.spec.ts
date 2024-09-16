import * as chai from "chai";
import { Point, pointToWkt, Rectangle } from "../geom";
import { InvalidCoordinateError } from "../coordinate";
import { SVGPathWalker } from "../path/SVGPathWalker";
import { AffineTransformer } from "../transformer/AffineTransformer";
import { Tolerance } from "../Tolerance";
import { A_INSIDE_B, A_OUTSIDE_B, B_OUTSIDE_A, TOUCH } from "../Relation";

const expect = chai.expect;
const TOLERANCE = new Tolerance(0.1);

export const pointSpec = () => {
  it("creates points successfully", () => {
    expect(Point.valueOf(0, 0)).to.equal(Point.ORIGIN);
    expect(Point.valueOf(0, 1).toGeoJson()).to.eql({
      type: "Point",
      coordinates: [0, 1],
    });
    expect(Point.valueOf(2, 0).toGeoJson()).to.eql({
      type: "Point",
      coordinates: [2, 0],
    });
  });
  it("does not allow Infinte points", () => {
    expect(() => {
      Point.valueOf(Infinity, 0);
    }).to.throw(InvalidCoordinateError);
    expect(() => {
      Point.valueOf(0, -Infinity);
    }).to.throw(InvalidCoordinateError);
  });
  it("does not allow NaN points", () => {
    expect(() => {
      Point.valueOf(NaN, 0);
    }).to.throw(InvalidCoordinateError);
    expect(() => {
      Point.valueOf(0, NaN);
    }).to.throw(InvalidCoordinateError);
  });
  it("returns itself as a centroid", () => {
    const point = Point.valueOf(1, 2);
    expect(point.getCentroid()).to.equal(point);
  });
  it("returns the bounds", () => {
    const point = Point.valueOf(1.1, 2.5);
    const bounds = point.getBounds();
    expect(bounds.minX).to.equal(1.1);
    expect(bounds.minY).to.equal(2.5);
    expect(bounds.maxX).to.equal(1.1);
    expect(bounds.maxY).to.equal(2.5);
    expect(point.getBounds()).to.equal(bounds);
  });
  it("creates paths which are a combination of a move and a line", () => {
    const point = Point.valueOf(1, 2);
    const walker = new SVGPathWalker();
    point.walkPath(walker);
    expect(walker.toPath()).to.equal("M1 2L1 2");
  });
  it("generates wkt", () => {
    const point = Point.valueOf(1, 2);
    const format = new Intl.NumberFormat("en", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format;
    expect(point.toWkt(format)).to.equal("POINT(1.00 2.00)");
    expect(pointToWkt(2, 1)).to.equal("POINT(2 1)");
  });
  it("generates geoJson", () => {
    const point = Point.valueOf(1, 2);
    expect(point.toGeoJson()).to.eql({ type: "Point", coordinates: [1, 2] });
  });
  it("is always valid, normalized and generalized", () => {
    const point = Point.valueOf(1, 2);
    expect(point.isValid()).to.equal(true);
    expect(point.isNormalized()).to.equal(true);
    expect(point.normalize()).to.equal(point);
    expect(point.generalize()).to.equal(point);
  });
  it("transforms successfully", () => {
    const point = Point.valueOf(1, 2);
    const transformer = AffineTransformer.IDENTITY.translate(3, 4);
    const transformed = point.transform(transformer);
    expect(transformed.toWkt()).to.equal("POINT(4 6)");
  });
  it("relates to points", () => {
    const point = Point.valueOf(1, 2);
    expect(point.relatePoint(1, 2, TOLERANCE)).to.equal(TOUCH);

    expect(point.relatePoint(0.8, 2, TOLERANCE)).to.equal(
      A_OUTSIDE_B | B_OUTSIDE_A,
    );
    expect(point.relatePoint(1, 1.8, TOLERANCE)).to.equal(
      A_OUTSIDE_B | B_OUTSIDE_A,
    );
    expect(point.relatePoint(1.2, 2, TOLERANCE)).to.equal(
      A_OUTSIDE_B | B_OUTSIDE_A,
    );
    expect(point.relatePoint(1, 2.2, TOLERANCE)).to.equal(
      A_OUTSIDE_B | B_OUTSIDE_A,
    );

    expect(point.relatePoint(0.91, 2, TOLERANCE)).to.equal(TOUCH);
    expect(point.relatePoint(1, 1.91, TOLERANCE)).to.equal(TOUCH);
    expect(point.relatePoint(1.09, 2, TOLERANCE)).to.equal(TOUCH);
    expect(point.relatePoint(1, 2.09, TOLERANCE)).to.equal(TOUCH);
  });
  it("relates to geometries", () => {
    const point = Point.valueOf(2, 3);
    const rectangle = new Rectangle(1, 2, 3, 4);
    expect(point.relate(rectangle, TOLERANCE)).to.equal(
      A_INSIDE_B | B_OUTSIDE_A,
    );
    expect(point.relate(point, TOLERANCE)).to.equal(TOUCH);
  });
  it("unions successfully", () => {
    const point = Point.valueOf(2, 3);
    expect(point.union(point, TOLERANCE).toWkt()).to.equal("POINT(2 3)");
    expect(point.union(Point.valueOf(2.01, 3.01), TOLERANCE).toWkt()).to.equal(
      "POINT(2.01 3.01)",
    );
    expect(point.union(Point.valueOf(1, 2), TOLERANCE).toWkt()).to.equal(
      "MULTIPOINT(1 2, 2 3)",
    );
    const rectangle = new Rectangle(1, 2, 3, 4);
    expect(point.union(rectangle, TOLERANCE)).to.equal(rectangle);
    const result = point.union(new Rectangle(6, 7, 8, 9), TOLERANCE);
    expect(result.toWkt()).to.equal(
      "GEOMETRYCOLLECTION(POLYGON((6 7, 8 7, 8 9, 6 9, 6 7)),POINT(2 3))",
    );
  });
  it("intersection successfully", () => {
    const point = Point.valueOf(2, 3);
    expect(point.intersection(point, TOLERANCE)).to.equal(point);
    expect(
      point.intersection(Point.valueOf(2.01, 3.01), TOLERANCE).toWkt(),
    ).to.equal("POINT(2 3)");
    expect(point.intersection(Point.valueOf(1, 2), TOLERANCE)).to.equal(null);
    const rectangle = new Rectangle(1, 2, 3, 4);
    expect(point.intersection(rectangle, TOLERANCE)).to.equal(point);
    const result = point.intersection(new Rectangle(6, 7, 8, 9), TOLERANCE);
    expect(result).to.equal(null);
  });
  it("less successfully", () => {
    const point = Point.valueOf(2, 3);
    expect(point.less(point, TOLERANCE)).to.equal(point);
    expect(point.less(Point.valueOf(2.01, 3.01), TOLERANCE).toWkt()).to.equal(
      "POINT(2 3)",
    );
    expect(point.less(Point.valueOf(1, 2), TOLERANCE)).to.equal(null);
    const rectangle = new Rectangle(1, 2, 3, 4);
    expect(point.less(rectangle, TOLERANCE)).to.equal(point);
    const result = point.less(new Rectangle(6, 7, 8, 9), TOLERANCE);
    expect(result).to.equal(null);
  });
  it("xor successfully", () => {
    const point = Point.valueOf(2, 3);
    expect(point.xor(point, TOLERANCE)).to.equal(null);
    expect(point.xor(Point.valueOf(2.01, 3.01), TOLERANCE)).to.equal(null);
    expect(point.xor(Point.valueOf(1, 2), TOLERANCE).toWkt()).to.equal(
      "MULTIPOINT(1 2, 2 3)",
    );
    const rectangle = new Rectangle(1, 2, 3, 4);
    expect(point.xor(rectangle, TOLERANCE).toWkt()).to.equal(
      "POLYGON((1 2, 3 2, 3 4, 1 4, 1 2))",
    );
    const result = point.xor(new Rectangle(6, 7, 8, 9), TOLERANCE);
    expect(result.toWkt()).to.equal(
      "GEOMETRYCOLLECTION(POLYGON((6 7, 8 7, 8 9, 6 9, 6 7)),POINT(2 3))",
    );
  });
};
