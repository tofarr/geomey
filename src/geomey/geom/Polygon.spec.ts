import * as chai from "chai";
import {
  comparePolygonsForSort,
  GeometryCollection,
  LinearRing,
  LineSegment,
  LineString,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Point,
  Polygon,
} from "../geom";
import { Tolerance } from "../Tolerance";
import { WktParser } from "../parser/WktParser";

const expect = chai.expect;
const TOLERANCE = new Tolerance(0.1);

export const polygonSpec = () => {
  it("getCentroid returns and caches the centroid", () => {
    const polygon = new Polygon(new LinearRing([0, 0, 100, 0, 100, 80, 0, 80]));
    const centroid = polygon.getCentroid();
    expect(centroid.toWkt()).to.equal("POINT(50 40)");
    expect(polygon.getCentroid()).to.equal(centroid);
  });
  it("returns GeoJson", () => {
    const parser = new WktParser();
    const polygon = parser.parse(
      "POLYGON((0 0, 100 0, 100 60, 0 60, 0 0),(10 20, 20 20, 20 50, 10 50, 10 20),(30 10, 60 20, 70 50, 30 40, 30 10))",
    );
    expect(polygon.toGeoJson()).to.eql({
      type: "Polygon",
      coordinates: [
        [
          [0, 0],
          [100, 0],
          [100, 60],
          [0, 60],
          [0, 0],
        ],
        [
          [10, 50],
          [10, 20],
          [20, 20],
          [20, 50],
          [10, 50],
        ],
        [
          [30, 40],
          [30, 10],
          [60, 20],
          [70, 50],
          [30, 40],
        ],
      ],
    });
  });
  it("validates the shell doesn't self intersect", () => {
    expect(
      new Polygon(new LinearRing([0, 0, 100, 0, 100, 80, 0, 80])).isValid(
        TOLERANCE,
      ),
    ).to.equal(true);
    expect(
      new Polygon(new LinearRing([0, 0, 100, 0, 0, 80, 100, 80])).isValid(
        TOLERANCE,
      ),
    ).to.equal(false);
    expect(
      new Polygon(new LinearRing([0, 0, 100, 0, 100, 80, 0, 80])).isValid(
        new Tolerance(100),
      ),
    ).to.equal(false);
  });
  it("validates the shell is in the correct order", () => {
    expect(
      new Polygon(new LinearRing([0, 0, 0, 80, 100, 80, 100, 0])).isValid(
        TOLERANCE,
      ),
    ).to.equal(false);
  });
  it("validates that holes don't self intersect", () => {
    expect(
      new Polygon(new LinearRing([0, 0, 100, 0, 100, 80, 0, 80]), [
        new LinearRing([10, 10, 90, 10, 90, 70, 10, 70]),
      ]).isValid(TOLERANCE),
    ).to.equal(true);
    expect(
      new Polygon(new LinearRing([0, 0, 100, 0, 100, 80, 0, 80]), [
        new LinearRing([10, 10, 90, 10, 10, 70, 90, 70]),
      ]).isValid(TOLERANCE),
    ).to.equal(false);
  });
  it("validates that holes are fully inside", () => {
    expect(
      new Polygon(new LinearRing([0, 0, 100, 0, 100, 100, 0, 100]), [
        new LinearRing([0, 50, 30, 20, 30, 80]),
      ]).isValid(TOLERANCE),
    ).to.equal(true);
    expect(
      new Polygon(new LinearRing([10, 0, 100, 0, 100, 100, 10, 100]), [
        new LinearRing([0, 50, 30, 20, 30, 80]),
      ]).isValid(TOLERANCE),
    ).to.equal(false);
  });
  it("validates that holes links do not touch edge links", () => {
    expect(
      new Polygon(new LinearRing([10, 0, 100, 0, 100, 100, 10, 100]), [
        new LinearRing([10, 20, 30, 20, 30, 80, 10, 80]),
      ]).isValid(TOLERANCE),
    ).to.equal(false);
  });
  it("validates that holes do not touch on edge", () => {
    const polygon = new Polygon(
      new LinearRing([0, 0, 100, 0, 100, 100, 0, 100]),
      [
        new LinearRing([10, 50, 50, 10, 50, 90]),
        new LinearRing([50, 10, 90, 50, 50, 90]),
      ],
    );
    expect(polygon.isValid(TOLERANCE)).to.equal(false);
  });
  it("validates that holes do not overlap", () => {
    const polygon = new Polygon(
      new LinearRing([0, 0, 100, 0, 100, 100, 0, 100]),
      [
        new LinearRing([10, 10, 80, 50, 10, 90]),
        new LinearRing([20, 50, 90, 10, 90, 90]),
      ],
    );
    expect(polygon.isValid(TOLERANCE)).to.equal(false);
  });
  it("normalizes the shell", () => {
    const polygon = new Polygon(
      new LinearRing([0, 0, 0, 100, 100, 100, 100, 0]),
    );
    expect(polygon.isNormalized()).to.equal(false);
    const normalized = polygon.normalize();
    expect(normalized.toWkt()).to.equal(
      "POLYGON((0 0, 100 0, 100 100, 0 100, 0 0))",
    );
    expect(normalized.normalize()).to.equal(normalized);
    expect(polygon.normalize()).to.equal(normalized);
    expect(normalized.isNormalized()).to.equal(true);
  });
  it("normalizes holes", () => {
    const polygon = new Polygon(
      new LinearRing([0, 0, 100, 0, 100, 100, 0, 100]),
      [new LinearRing([90, 90, 90, 10, 10, 10, 10, 90])],
    );
    expect(polygon.isNormalized()).to.equal(false);
    const normalized = polygon.normalize();
    expect(normalized.toWkt()).to.equal(
      "POLYGON((0 0, 100 0, 100 100, 0 100, 0 0),(10 10, 10 90, 90 90, 90 10, 10 10))",
    );
    expect(normalized.normalize()).to.equal(normalized);
    expect(polygon.normalize()).to.equal(normalized);
    expect(normalized.isNormalized()).to.equal(true);
  });
  it("normalizes nordering of holes", () => {
    const polygon = new Polygon(
      new LinearRing([0, 0, 100, 0, 100, 100, 0, 100]),
      [
        new LinearRing([50, 10, 90, 10, 90, 90, 50, 90]),
        new LinearRing([10, 10, 50, 10, 50, 90, 10, 90]),
      ],
    );
    expect(polygon.isNormalized()).to.equal(false);
    const normalized = polygon.normalize();
    expect(normalized.toWkt()).to.equal(
      "POLYGON((0 0, 100 0, 100 100, 0 100, 0 0),(10 10, 10 90, 50 90, 50 10, 10 10),(50 10, 50 90, 90 90, 90 10, 50 10))",
    );
  });
  it("generalizes successfully", () => {
    const polygon = new Polygon(
      new LinearRing([
        0, 0, 50, 0.01, 100, 0, 99.99, 50, 100, 100, 50, 99.99, 0, 100, 0.01,
        50,
      ]),
      [
        new LinearRing([10, 50, 30.01, 30.01, 50, 10, 50, 90]),
        new LinearRing([50, 10, 90, 50, 75.01, 75.01, 50, 90]),
      ],
    );
    expect(polygon.generalize(TOLERANCE).toWkt()).to.equal(
      "POLYGON((0 0, 100 0, 100 100, 0 100, 0 0),(10 50, 50 90, 50 10, 10 50),(50 10, 50 90, 75 75, 90 50, 50 10))",
    );
    expect(polygon.generalize(new Tolerance(100))).to.equal(
      polygon.getCentroid(),
    );
  });
  it("less successfully", () => {
    const polygon = new Polygon(
      new LinearRing([
        0, 0, 50, 0.01, 100, 0, 99.99, 50, 100, 100, 50, 99.99, 0, 100, 0.01,
        50,
      ]),
      [
        new LinearRing([10, 50, 30.01, 30.01, 50, 10, 50, 90]),
        new LinearRing([50, 10, 90, 50, 75.01, 75.01, 50, 90]),
      ],
    );
    expect(polygon.less(Point.valueOf(50, 50), TOLERANCE)).to.equal(polygon);
    expect(polygon.less(new LineSegment(0, 0, 100, 100), TOLERANCE)).to.equal(
      polygon,
    );
    expect(polygon.less(new LineString([0, 0, 100, 100]), TOLERANCE)).to.equal(
      polygon,
    );
    expect(polygon.less(new MultiPoint([0, 0, 100, 100]), TOLERANCE)).to.equal(
      polygon,
    );
    expect(
      polygon.less(
        new MultiLineString([
          new LineString([0, 0, 100, 100]),
          new LineString([0, 100, 100, 0]),
        ]),
        TOLERANCE,
      ),
    ).to.equal(polygon);
    expect(
      polygon.less(
        new GeometryCollection(new MultiPoint([0, 0, 100, 100])),
        TOLERANCE,
      ),
    ).to.equal(polygon);
  });
  it("build nested", () => {
    const polygon = new MultiPolygon([
      new Polygon(new LinearRing([0, 0, 100, 0, 100, 100, 0, 100]), [
        new LinearRing([10, 10, 90, 10, 90, 90, 10, 90]),
      ]),
      new Polygon(new LinearRing([20, 20, 80, 20, 80, 80, 20, 80]), [
        new LinearRing([30, 30, 70, 30, 70, 70, 30, 70]),
      ]),
      new Polygon(new LinearRing([40, 40, 60, 40, 60, 60, 40, 60])),
    ]);
    const result = polygon.generalize(TOLERANCE).toWkt();
    expect(result).to.equal(
      "MULTIPOLYGON(((0 0, 100 0, 100 100, 0 100, 0 0),(10 10, 10 90, 90 90, 90 10, 10 10)),((20 20, 80 20, 80 80, 20 80, 20 20),(30 30, 30 70, 70 70, 70 30, 30 30)),((40 40, 60 40, 60 60, 40 60, 40 40)))",
    );
  });
  it("compares polygons successfully", () => {
    const a = new Polygon(new LinearRing([0, 0, 100, 0, 100, 100, 0, 100]), [
      new LinearRing([10, 10, 90, 10, 90, 90, 10, 90]),
    ]);
    const b = new Polygon(new LinearRing([0, 0, 100, 0, 100, 100, 0, 100]), [
      new LinearRing([11, 10, 90, 10, 90, 90, 10, 90]),
    ]);
    expect(comparePolygonsForSort(a, a)).to.equal(0);
    expect(comparePolygonsForSort(a, b)).to.equal(-1);
    expect(comparePolygonsForSort(b, a)).to.equal(1);
  });
  it("intersects points as expected", () => {
    const polygon = new Polygon(new LinearRing([0, 0, 100, 0, 50, 100]));
    const a = Point.valueOf(10, 80);
    const b = Point.valueOf(50, 80);
    expect(polygon.intersection(a, TOLERANCE)).to.equal(null);
    expect(polygon.intersection(b, TOLERANCE)).to.equal(b);
  });
};
