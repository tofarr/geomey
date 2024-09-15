import * as chai from "chai";
import { Tolerance } from "../Tolerance";
import {
  forEachAngle,
  forEachRingCoordinate,
  forEachRingLineSegmentCoordinates,
  LinearRing,
} from "./LinearRing";
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
    expect(new LinearRing([0, 0, 100, 0, 50, 50]).isConvex()).to.equal(true);
    expect(
      new LinearRing([0, 0, 100, 0, 50, 50, 100, 100, 0, 100]).isConvex(),
    ).to.equal(false);
  });
  it("normalizes as expected", () => {
    const ring = new LinearRing([100, 100, 100, 0, 0, 0, 0, 100]);
    expect(ring.isNormalized()).to.equal(false);
    expect(ring.isNormalized()).to.equal(false);
    const normalized = ring.normalize();
    expect(normalized.isNormalized()).to.equal(true);
    expect(
      new LinearRing([100, 100, 0, 100, 0, 0, 100, 0]).isNormalized(),
    ).to.equal(false);
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
    expect(
      new LinearRing([0, 0, 100, 0, 100, 100, 0, 100]).isConvex(),
    ).to.equal(true);
    expect(new LinearRing([0, 0, 100, 0, 25, 25, 0, 100]).isConvex()).to.equal(
      false,
    );
    expect(
      new LinearRing([0, 0, 100, 0, 100, 100, 0, 100, 50, 50]).isConvex(),
    ).to.equal(false);
  });
  it("converts to polygon", () => {
    expect(
      new LinearRing([0, 0, 100, 0, 100, 100]).getPolygon().toWkt(),
    ).to.equal("POLYGON((0 0, 100 0, 100 100, 0 0))");
  });
  it("validates as expected", () => {
    expect(
      new LinearRing([0, 0, 100, 0, 100, 100]).isValid(new Tolerance(0.01)),
    ).to.equal(true);
    expect(
      new LinearRing([0, 0, 1, 0, 1, 1]).isValid(new Tolerance(2)),
    ).to.equal(false);
    expect(
      new LinearRing([0, 0, 100, 0, 100, 100, 0, 100]).isValid(
        new Tolerance(0.01),
      ),
    ).to.equal(true);
    expect(
      new LinearRing([0, 0, 100, 0, 0, 100, 100, 100]).isValid(
        new Tolerance(0.01),
      ),
    ).to.equal(false);
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
  });
  it("stops iterating coordinates when a consumer returns false", () => {
    const coordinates = [0, 0, 100, 0, 100, 100, 0, 100];
    const results = [];
    expect(
      forEachRingCoordinate(coordinates, (x, y) => {
        results.push(x, y);
      }),
    ).to.equal(true);
    expect(results).to.eql([0, 0, 100, 0, 100, 100, 0, 100, 0, 0]);
    results.length = 0;
    expect(
      forEachRingCoordinate(
        coordinates,
        (x, y) => {
          results.push(x, y);
          return false;
        },
        true,
      ),
    ).to.equal(false);
    expect(results).to.eql([0, 0]);
    results.length = 0;
    expect(
      forEachRingCoordinate(
        coordinates,
        (x, y) => {
          results.push(x, y);
          return x !== 100 || y !== 100;
        },
        true,
      ),
    ).to.equal(false);
    expect(results).to.eql([0, 0, 0, 100, 100, 100]);
  });
  it("stops iterating linesegments when a consumer returns false", () => {
    const coordinates = [0, 0, 100, 0, 100, 100, 0, 100];
    const results = [];
    expect(
      forEachRingLineSegmentCoordinates(
        coordinates,
        (ax, ay, bx, by) => {
          results.push([ax, ay, bx, by]);
          return ax !== 100 || ay !== 100;
        },
        true,
      ),
    ).to.equal(false);
    expect(results).to.eql([
      [0, 100, 0, 0],
      [100, 100, 0, 100],
    ]);
  });
  it("calculates polygon", () => {
    const ring = new LinearRing([100, 100, 100, 0, 0, 0, 0, 100]);
    const polygon = ring.getPolygon();
    expect(polygon.toWkt()).to.equal(
      "POLYGON((100 100, 100 0, 0 0, 0 100, 100 100))",
    );
    expect(ring.getPolygon()).to.equal(polygon);
  });
  it("gets all angles", () => {
    const coordinates = [0, 0, 100, 0, 50, 50];
    const angles = [];
    forEachAngle(
      coordinates,
      (ax, ay, bx, by, cx, cy) => {
        angles.push([ax, ay, bx, by, cx, cy]);
      },
      4,
      2,
    );
    expect(angles).to.eql([
      [100, 0, 50, 50, 0, 0],
      [50, 50, 0, 0, 100, 0],
    ]);
  });
};
