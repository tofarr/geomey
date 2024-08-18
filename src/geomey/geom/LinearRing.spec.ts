import * as chai from "chai";
import { Tolerance } from "../Tolerance";
import { parseWkt } from "../parser/WktParser";
import { Triangle } from "./Triangle";
import { MultiPolygon } from "./MultiPolygon";
import { LinearRing } from "./LinearRing";
import { InvalidCoordinateError } from "../coordinate";

const expect = chai.expect;
const TOLERANCE = new Tolerance(0.05);

export const linearRingSpec = () => {
  it("throws an error when coordinates are invalid", () => {
    expect(() => {
      new LinearRing([0, 0, 1, 1]);
    }).to.throw(InvalidCoordinateError);
    expect(() => {
      new LinearRing([0, 0, 1, 0, 1, 1, 0]);
    }).to.throw(InvalidCoordinateError);
    expect(() => {
      new LinearRing([0, 0, 1, 0, 1, NaN]);
    }).to.throw(InvalidCoordinateError);
    expect(() => {
      new LinearRing([0, 0, 1, 0, Infinity, 1]);
    }).to.throw(InvalidCoordinateError);
  });
  it("calculates centroid", () => {
    const linearRing = new LinearRing([0, 0, 10, 0, 10, 10, 0, 10]);
    const centroid = linearRing.getCentroid();
    expect(centroid.x).to.equal(5);
    expect(centroid.y).to.equal(5);
    expect(linearRing.getCentroid()).to.equal(centroid);
  });
  it("isConvex returns true for convex rings", () => {
    const wkt =
      "POLYGON((0 0, 10 0, 10 10, 0 10, 0 2, 8 2, 8 8, 2 8, 2 4, 6 4, 6 6, 5 6, 5 5, 3 5, 3 7, 7 7, 7 3, 1 3, 1 9, 9 9, 9 1, 0 1))";
    const parsed = parseWkt(wkt);
    const triangles = Triangle.valueOf(parsed, TOLERANCE);
    const rendered = new MultiPolygon(
      triangles.map((t) => t.getPolygon()),
    ).toWkt();
    expect(rendered).to.equal(
      "MULTIPOLYGON(((0 0, 10 0, 9 1, 0 0)),((0 1, 0 0, 9 1, 0 1)),((0 2, 8 2, 7 3, 0 2)),((0 2, 1 3, 1 9, 0 2)),((0 10, 0 2, 1 9, 0 10)),((0 10, 9 9, 10 10, 0 10)),((7 3, 1 3, 0 2, 7 3)),((1 9, 9 9, 0 10, 1 9)),((2 4, 6 4, 5 5, 2 4)),((2 4, 3 5, 3 7, 2 4)),((2 8, 2 4, 3 7, 2 8)),((2 8, 7 7, 8 8, 2 8)),((5 5, 3 5, 2 4, 5 5)),((3 7, 7 7, 2 8, 3 7)),((5 5, 6 6, 5 6, 5 5)),((6 4, 6 6, 5 5, 6 4)),((7 3, 8 8, 7 7, 7 3)),((8 2, 8 8, 7 3, 8 2)),((9 1, 10 10, 9 9, 9 1)),((10 0, 10 10, 9 1, 10 0)))",
    );
  });
  it("normalizes as expected", () => {
    const ring = new LinearRing([100, 100, 100, 0, 0, 0, 0, 100]);
    expect(ring.isNormalized()).to.equal(false);
    expect(ring.isNormalized()).to.equal(false);
    const normalized = ring.normalize();
    expect(normalized.isNormalized()).to.equal(true);
    expect(new LinearRing([100, 100, 0, 100, 0, 0, 100, 0]).isNormalized()).to.equal(false);
  });
  it("generates WKT", () => {
    const ring = new LinearRing([100, 100, 100, 0, 0, 0, 0, 100]);
    expect(ring.toWkt()).to.equal(
      "POLYGON((100 100, 100 0, 0 0, 0 100, 100 100))",
    );
  });
  it("generates GeoJson", () => {
    const ring = new LinearRing([100, 100, 100, 0, 0, 0, 0, 100]);
    expect(ring.toGeoJson()).to.eql({
      type: "Polygon",
      coordinates: [
        [100, 100],
        [100, 0],
        [0, 0],
        [0, 100],
        [100, 100],
      ],
    });
  });
  it("determines if a ring is convex", () => {
    expect(new LinearRing([0, 0, 100, 0, 100, 100]).isConvex()).to.equal(true);
    expect(new LinearRing([0, 0, 100, 0, 100, 100, 0, 100]).isConvex()).to.equal(true);
    expect(new LinearRing([0, 0, 100, 0, 25, 25, 0, 100]).isConvex()).to.equal(false);
    expect(new LinearRing([0, 0, 100, 0, 100, 100, 0, 100, 50, 50]).isConvex()).to.equal(false);
  });
  it("converts to polygon", () => {
    expect(new LinearRing([0, 0, 100, 0, 100, 100]).getPolygon().toWkt()).to.equal("POLYGON((0 0, 100 0, 100 100, 0 0))");
  });
  it("validates as expected", () => {
    expect(new LinearRing([0, 0, 100, 0, 100, 100]).isValid(new Tolerance(0.01))).to.equal(true);
    expect(new LinearRing([0, 0, 1, 0, 1, 1]).isValid(new Tolerance(2))).to.equal(false);
    expect(new LinearRing([0, 0, 100, 0, 100, 100, 0, 100]).isValid(new Tolerance(0.01))).to.equal(true);
    expect(new LinearRing([0, 0, 100, 0, 0, 100, 100, 100]).isValid(new Tolerance(0.01))).to.equal(false);
  });
  it("generalizes as expected", () => {
    const linearRing = new LinearRing([
      0, 0, 5, 0.5, 10, 0, 10, 2, 5, 2.5, 2, 2, 2.5, 5, 2, 8, 5, 7.5, 10, 8, 10,
      10, 5, 10.5, 0, 10, 0.5, 5,
    ]);
    const generalized = linearRing.generalize(new Tolerance(1));
    expect(generalized.toWkt()).to.equal(
      "POLYGON((0 0, 10 0, 10 2, 2 2, 2 8, 10 8, 10 10, 0 10, 0 0))",
    );
    expect(linearRing.generalize(new Tolerance(11)).toWkt()).to.equal(
      "POINT(4.3 5.5)",
    );
    expect(linearRing.generalize(new Tolerance(0.01))).to.equal(linearRing);
  })
};
