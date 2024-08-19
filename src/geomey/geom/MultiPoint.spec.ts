import * as chai from "chai";
import { MultiPoint, Point } from "../geom";
import { Tolerance } from "../Tolerance";
import { InvalidCoordinateError } from "../coordinate";
import { AffineTransformer } from "../transformer/AffineTransformer";
import { A_OUTSIDE_B, B_OUTSIDE_A, DISJOINT, TOUCH } from "../Relation";

const expect = chai.expect;
const TOLERANCE = new Tolerance(0.1);

export const multiPointSpec = () => {
  it("constructor requires at least 2 coordinate", () => {
    expect(() => {
      new MultiPoint([]);
    }).to.throw(InvalidCoordinateError);
  });
  it("constructor requires an even number of coordinates", () => {
    expect(() => {
      new MultiPoint([1, 2, 3]);
    }).to.throw(InvalidCoordinateError);
  });
  it("constructor coordinates must not be infinite", () => {
    expect(() => {
      new MultiPoint([1, 2, 3, Infinity]);
    }).to.throw(InvalidCoordinateError);
  });
  it("constructor coordinates must not be NaN", () => {
    expect(() => {
      new MultiPoint([1, 2, NaN, 3]);
    }).to.throw(InvalidCoordinateError);
  });
  it("getCentroid returns and caches the centroid", () => {
    const points = new MultiPoint([0, 0, 2, 0, 2, 3, 0, 3]);
    const centroid = points.getCentroid();
    expect(centroid.toWkt()).to.equal("POINT(1 1.5)");
    expect(points.getCentroid()).to.equal(centroid);
  });
  it("returns GeoJson", () => {
    const points = new MultiPoint([
      0, 0, 10, 0, 10, 2, 2, 2, 2, 8, 10, 8, 10, 10, 0, 10,
    ]);
    expect(points.toGeoJson()).to.eql({
      type: "MultiPoint",
      coordinates: [
        [0, 0],
        [10, 0],
        [10, 2],
        [2, 2],
        [2, 8],
        [10, 8],
        [10, 10],
        [0, 10],
      ],
    });
  });
  it("normalizes successfully", () => {
    const multiPoint = new MultiPoint([6, 7, 4, 5, 2, 3, 4, 5]);
    expect(multiPoint.isNormalized()).to.equal(false);
    expect(multiPoint.isNormalized()).to.equal(false);
    const normalized = multiPoint.normalize();
    expect(multiPoint.normalize()).to.equal(normalized);
    expect(normalized.normalize()).to.equal(normalized);
    expect(normalized.toWkt()).to.equal("MULTIPOINT(2 3, 4 5, 4 5, 6 7)");
    expect(new MultiPoint([2, 3]).normalize().toWkt()).to.equal("POINT(2 3)");
  });
  it("validates successfully", () => {
    expect(new MultiPoint([4, 5]).isValid(TOLERANCE)).to.equal(true);
    expect(new MultiPoint([6, 7, 4, 5, 2, 3]).isValid(TOLERANCE)).to.equal(
      true,
    );
    expect(
      new MultiPoint([6, 7, 4, 5, 2, 3, 4, 5]).isValid(TOLERANCE),
    ).to.equal(false);
  });
  it("transforms successfully", () => {
    const multiPoint = new MultiPoint([6, 7, 4, 5, 2, 3, 4, 5]);
    const transformed = multiPoint.transform(
      AffineTransformer.IDENTITY.scale(10),
    );
    expect(transformed.toWkt()).to.equal(
      "MULTIPOINT(60 70, 40 50, 20 30, 40 50)",
    );
  });
  it("generalizes successfully", () => {
    expect(new MultiPoint([4, 5]).generalize(TOLERANCE).toWkt()).to.equal(
      "POINT(4 5)",
    );
    expect(
      new MultiPoint([6, 7, 4, 5, 2, 3]).generalize(TOLERANCE).toWkt(),
    ).to.equal("MULTIPOINT(2 3, 4 5, 6 7)");
    expect(
      new MultiPoint([6, 7, 4, 5, 2, 3, 4, 5]).generalize(TOLERANCE).toWkt(),
    ).to.equal("MULTIPOINT(2 3, 4 5, 6 7)");
    expect(
      new MultiPoint([6, 7, 4, 5, 2, 3]).generalize(new Tolerance(10)).toWkt(),
    ).to.equal("POINT(0 0)");
  });

  it("relates to other geometries", () => {
    expect(
      new MultiPoint([6, 7]).relateGeometry(
        Point.valueOf(6.01, 7.01),
        TOLERANCE,
      ),
    ).to.equal(TOUCH);
    expect(
      new MultiPoint([6, 7, 4, 5, 2, 3]).relateGeometry(
        Point.valueOf(4.01, 5.01),
        TOLERANCE,
      ),
    ).to.equal(TOUCH | A_OUTSIDE_B);
    expect(
      new MultiPoint([6, 7]).relateGeometry(Point.valueOf(6, 8), TOLERANCE),
    ).to.equal(DISJOINT);
    expect(
      new MultiPoint([6, 7]).relateGeometry(
        new MultiPoint([6.01, 7.01]),
        TOLERANCE,
      ),
    ).to.equal(TOUCH);
    expect(
      new MultiPoint([6, 7, 4, 5, 2, 3]).relateGeometry(
        new MultiPoint([4.01, 5.01]),
        TOLERANCE,
      ),
    ).to.equal(TOUCH | A_OUTSIDE_B);
    expect(
      new MultiPoint([6, 7]).relateGeometry(new MultiPoint([6, 8]), TOLERANCE),
    ).to.equal(DISJOINT);
    expect(
      new MultiPoint([6, 7, 4, 5]).relateGeometry(
        new MultiPoint([6, 7, 8, 9]),
        TOLERANCE,
      ),
    ).to.equal(TOUCH | A_OUTSIDE_B | B_OUTSIDE_A);
  });
};
