import * as chai from "chai";
import {
  GeometryCollection,
  LinearRing,
  LineString,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Polygon,
  Rectangle,
} from ".";
import { Tolerance } from "../Tolerance";
import { EmptyError } from "./EmptyError";
import { AffineTransformer } from "../transformer/AffineTransformer";
import { A_OUTSIDE_B, DISJOINT, TOUCH } from "../Relation";
import { SVGPathWalker } from "../path/SVGPathWalker";

const expect = chai.expect;
const TOLERANCE = new Tolerance(0.1);

const MULTI_POINT = new MultiPoint([101, 102, 103, 104]);
const MULTI_LINE_STRING = new MultiLineString([
  new LineString([3, 5, 7, 11, 13, 17]),
  new LineString([23, 29, 31, 37]),
]);
const MULTI_POLYGON = new MultiPolygon([
  Rectangle.valueOf([20, 30, 50, 70]).getPolygon(),
  Rectangle.valueOf([80, 90, 110, 120]).getPolygon(),
]);
const NON_NORMALIZED_MULTI_POINT = new MultiPoint([103, 104, 101, 102]);
const NON_NORMALIZED_MULTI_LINE_STRING = new MultiLineString([
  new LineString([13, 17, 7, 11, 3, 5]),
]);
const NON_NORMALIZED_MULTI_POLYGON = new MultiPolygon([
  new Polygon(new LinearRing([50, 70, 50, 30, 20, 30, 20, 70])),
]);

export const geometryCollectionSpec = () => {
  it("prevents construction of empty collections", () => {
    expect(() => {
      new GeometryCollection();
    }).to.throw(EmptyError);
  });
  it("calculates a centroid", () => {
    const geometryCollection = new GeometryCollection(
      MULTI_POINT,
      MULTI_LINE_STRING,
      MULTI_POLYGON,
    );
    const centroid = geometryCollection.getCentroid();
    expect(centroid.x).to.equal(56.5);
    expect(centroid.y).to.equal(62.5);
  });
  it("calculates bounds", () => {
    expect(
      new GeometryCollection(null, MULTI_LINE_STRING, MULTI_POLYGON)
        .getBounds()
        .toJson(),
    ).to.eql([3, 5, 110, 120]);
    expect(
      new GeometryCollection(MULTI_POINT, null, MULTI_POLYGON)
        .getBounds()
        .toJson(),
    ).to.eql([20, 30, 110, 120]);
    expect(
      new GeometryCollection(MULTI_POINT, MULTI_LINE_STRING)
        .getBounds()
        .toJson(),
    ).to.eql([3, 5, 103, 104]);
  });
  it("determines if normalized", () => {
    expect(
      new GeometryCollection(
        MULTI_POINT,
        MULTI_LINE_STRING,
        MULTI_POLYGON,
      ).isNormalized(),
    ).to.equal(true);
    expect(
      new GeometryCollection(NON_NORMALIZED_MULTI_POINT).isNormalized(),
    ).to.equal(false);
    expect(
      new GeometryCollection(
        null,
        NON_NORMALIZED_MULTI_LINE_STRING,
      ).isNormalized(),
    ).to.equal(false);
    expect(
      new GeometryCollection(
        MULTI_POINT,
        null,
        NON_NORMALIZED_MULTI_POLYGON,
      ).isNormalized(),
    ).to.equal(false);
    expect(
      new GeometryCollection(MULTI_POINT, MULTI_LINE_STRING).isNormalized(),
    ).to.equal(true);
    expect(
      new GeometryCollection(
        null,
        null,
        NON_NORMALIZED_MULTI_POLYGON,
      ).isNormalized(),
    ).to.equal(false);
    expect(
      new GeometryCollection(
        NON_NORMALIZED_MULTI_POINT,
        MULTI_LINE_STRING,
        MULTI_POLYGON,
      ).isNormalized(),
    ).to.equal(false);
    expect(
      new GeometryCollection(
        MULTI_POINT,
        NON_NORMALIZED_MULTI_LINE_STRING,
        MULTI_POLYGON,
      ).isNormalized(),
    ).to.equal(false);
    expect(
      new GeometryCollection(
        MULTI_POINT,
        MULTI_LINE_STRING,
        NON_NORMALIZED_MULTI_POLYGON,
      ).isNormalized(),
    ).to.equal(false);
  });
  it("normalizes to multi points", () => {
    expect(new GeometryCollection(MULTI_POINT).normalize().toWkt()).to.equal(
      "MULTIPOINT(101 102, 103 104)",
    );
  });
  it("normalizes to points", () => {
    expect(
      new GeometryCollection(new MultiPoint([3, 5])).normalize().toWkt(),
    ).to.equal("POINT(3 5)");
  });
  it("normalizes to line string", () => {
    const wkt = new GeometryCollection(
      MULTI_POINT,
      NON_NORMALIZED_MULTI_LINE_STRING,
    )
      .normalize()
      .toWkt();
    expect(wkt).to.equal(
      "GEOMETRYCOLLECTION(LINESTRING(3 5, 7 11, 13 17),POINT(101 102),POINT(103 104))",
    );
  });
  it("normalizes to multi polygon", () => {
    const wkt = new GeometryCollection(
      MULTI_POINT,
      null,
      NON_NORMALIZED_MULTI_POLYGON,
    )
      .normalize()
      .toWkt();
    expect(wkt).to.equal(
      "GEOMETRYCOLLECTION(POLYGON((20 30, 50 30, 50 70, 20 70, 20 30)),POINT(101 102),POINT(103 104))",
    );
  });
  it("isValid validates points", () => {
    const geometryCollection = new GeometryCollection(MULTI_POINT);
    expect(geometryCollection.isValid(TOLERANCE)).to.equal(true);
    expect(geometryCollection.isValid(new Tolerance(5))).to.equal(false);
  });
  it("isValid validates lineStrings", () => {
    const geometryCollection = new GeometryCollection(null, MULTI_LINE_STRING);
    expect(geometryCollection.isValid(TOLERANCE)).to.equal(true);
    expect(geometryCollection.isValid(new Tolerance(10))).to.equal(false);
  });
  it("isValid validates polygons", () => {
    const geometryCollection = new GeometryCollection(
      null,
      null,
      MULTI_POLYGON,
    );
    expect(geometryCollection.isValid(TOLERANCE)).to.equal(true);
    expect(geometryCollection.isValid(new Tolerance(50))).to.equal(false);
  });
  it("transforms as expected", () => {
    const geometryCollection = new GeometryCollection(
      MULTI_POINT,
      MULTI_LINE_STRING,
      MULTI_POLYGON,
    );
    const transformer = AffineTransformer.IDENTITY.translate(1, 2);
    const transformed = geometryCollection.transform(transformer);
    const wkt = transformed.toWkt();
    expect(wkt).to.equal(
      "GEOMETRYCOLLECTION(" +
        "POLYGON((21 32, 51 32, 51 72, 21 72, 21 32))," +
        "POLYGON((81 92, 111 92, 111 122, 81 122, 81 92))," +
        "LINESTRING(4 7, 8 13, 14 19)," +
        "LINESTRING(24 31, 32 39)," +
        "POINT(102 104)," +
        "POINT(104 106)" +
        ")",
    );
  });
  it("transforms as expected when there are no points", () => {
    const geometryCollection = new GeometryCollection(
      null,
      MULTI_LINE_STRING,
      MULTI_POLYGON,
    );
    const transformer = AffineTransformer.IDENTITY.translate(1, 2);
    const transformed = geometryCollection.transform(transformer);
    const wkt = transformed.toWkt();
    expect(wkt).to.equal(
      "GEOMETRYCOLLECTION(" +
        "POLYGON((21 32, 51 32, 51 72, 21 72, 21 32))," +
        "POLYGON((81 92, 111 92, 111 122, 81 122, 81 92))," +
        "LINESTRING(4 7, 8 13, 14 19)," +
        "LINESTRING(24 31, 32 39)" +
        ")",
    );
  });
  it("transforms as expected when there are only points", () => {
    const geometryCollection = new GeometryCollection(MULTI_POINT);
    const transformer = AffineTransformer.IDENTITY.translate(1, 2);
    const transformed = geometryCollection.transform(transformer);
    const wkt = transformed.toWkt();
    expect(wkt).to.equal(
      "GEOMETRYCOLLECTION(" + "POINT(102 104)," + "POINT(104 106)" + ")",
    );
  });
  it("generalizes as expected", () => {
    const geometryCollection = new GeometryCollection(
      MULTI_POINT,
      MULTI_LINE_STRING,
      MULTI_POLYGON,
    );
    let wkt = geometryCollection.generalize(new Tolerance(0.01)).toWkt();
    expect(wkt).to.equal(
      "GEOMETRYCOLLECTION(" +
        "POLYGON((20 30, 50 30, 50 70, 20 70, 20 30))," +
        "POLYGON((80 90, 110 90, 110 120, 80 120, 80 90))," +
        "LINESTRING(3 5, 7 11, 13 17)," +
        "LINESTRING(23 29, 31 37)," +
        "POINT(101 102)," +
        "POINT(103 104)" +
        ")",
    );
    wkt = geometryCollection.generalize(new Tolerance(40)).normalize().toWkt();
    expect(wkt).to.equal("MULTIPOINT(40 40, 120 120)");
  });
  it("relates to points", () => {
    const geometryCollection = new GeometryCollection(
      MULTI_POINT,
      MULTI_LINE_STRING,
      MULTI_POLYGON,
    );
    let relate = geometryCollection.relatePoint(101.01, 102.01, TOLERANCE);
    expect(relate).to.equal(A_OUTSIDE_B | TOUCH);
    relate = geometryCollection.relatePoint(1010, 102, TOLERANCE);
    expect(relate).to.equal(DISJOINT);
    relate = geometryCollection.relatePoint(18, 32, TOLERANCE);
    expect(relate).to.equal(DISJOINT);
  });
  it("converts SVG when there are no points", () => {
    const walker = new SVGPathWalker();
    new GeometryCollection(null, MULTI_LINE_STRING, MULTI_POLYGON).walkPath(
      walker,
    );
    const path = walker.toPath();
    expect(path).to.equal(
      "M20 30L50 30 50 70 20 70ZM80 90L110 90 110 120 80 120ZM3 5L7 11 13 17M23 29L31 37",
    );
  });

  it("converts SVG when there are no linestrings", () => {
    const walker = new SVGPathWalker();
    new GeometryCollection(MULTI_POINT, null, MULTI_POLYGON).walkPath(walker);
    const path = walker.toPath();
    expect(path).to.equal(
      "M20 30L50 30 50 70 20 70ZM80 90L110 90 110 120 80 120ZM101 102L101 102M103 104L103 104",
    );
  });
  it("converts SVG when there are no polygons", () => {
    const walker = new SVGPathWalker();
    new GeometryCollection(MULTI_POINT, MULTI_LINE_STRING).walkPath(walker);
    const path = walker.toPath();
    expect(path).to.equal(
      "M3 5L7 11 13 17M23 29L31 37M101 102L101 102M103 104L103 104",
    );
  });
};
