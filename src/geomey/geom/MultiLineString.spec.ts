import * as chai from "chai";
import { LineString, MultiLineString } from "../geom";
import { Tolerance } from "../Tolerance";
import { AffineTransformer } from "../transformer/AffineTransformer";
import { EmptyError } from "./EmptyError";

const expect = chai.expect;
const TOLERANCE = new Tolerance(0.1);

export const multiLineStringSpec = () => {
  it("constructor requires at least 1 linestring", () => {
    expect(() => {
      new MultiLineString([]);
    }).to.throw(EmptyError);
  });
  it("getCentroid returns and caches the centroid", () => {
    const lineStrings = new MultiLineString([
      new LineString([0, 0, 2, 0, 2, 3, 0, 3]),
      new LineString([0, 0, 10, 0]),
    ]);
    const centroid = lineStrings.getCentroid();
    expect(centroid.toWkt()).to.equal("POINT(5 1.5)");
    expect(lineStrings.getCentroid()).to.equal(centroid);
  });
  it("returns GeoJson", () => {
    const lineStrings = new MultiLineString([
      new LineString([0, 0, 2, 0, 2, 3, 0, 3]),
      new LineString([0, 0, 10, 0]),
    ]);
    expect(lineStrings.toGeoJson()).to.eql({
      type: "MultiLineString",
      coordinates: [
        [
          [0, 0],
          [2, 0],
          [2, 3],
          [0, 3],
        ],
        [
          [0, 0],
          [10, 0],
        ],
      ],
    });
  });
  it("normalizes successfully", () => {
    expect(
      new MultiLineString([
        new LineString([5, 0, 5, 10]),
        new LineString([10, 5, 0, 5]),
      ]).isNormalized(),
    ).to.equal(false);
    expect(
      new MultiLineString([
        new LineString([5, 0, 5, 10]),
        new LineString([0, 5, 10, 5]),
      ]).isNormalized(),
    ).to.equal(false);
    expect(
      new MultiLineString([
        new LineString([0, 5, 10, 5]),
        new LineString([5, 0, 5, 10]),
      ]).isNormalized(),
    ).to.equal(true);
  });

  it("validates successfully", () => {
    const lineStrings = new MultiLineString([
      new LineString([0, 5, 10, 5]),
      new LineString([5, 0, 5, 10]),
    ]);
    expect(lineStrings.isValid(TOLERANCE)).to.equal(true);
    expect(lineStrings.isValid(new Tolerance(11))).to.equal(false);
  });
  it("transforms successfully", () => {
    const multiPoint = new MultiLineString([
      new LineString([6, 7, 4, 5, 2, 3, 4, 5]),
    ]);
    const transformed = multiPoint.transform(
      AffineTransformer.IDENTITY.scale(10),
    );
    expect(transformed.toWkt()).to.equal(
      "MULTILINESTRING((40 50, 20 30, 40 50, 60 70))",
    );
  });
  it("generalizes successfully", () => {
    expect(
      new MultiLineString([new LineString([4, 5, 4.01, 5])])
        .generalize(TOLERANCE)
        .toWkt(),
    ).to.equal("POINT(4 5)");
    expect(
      new MultiLineString([
        new LineString([0, 5, 5, 5.01, 10, 5]),
        new LineString([5, 0, 5.01, 5, 5, 10]),
      ])
        .generalize(TOLERANCE)
        .toWkt(),
    ).to.equal(
      "MULTILINESTRING((0 5, 5 5),(5 0, 5 5),(5 5, 5 10),(5 5, 10 5))",
    );
  });
};
