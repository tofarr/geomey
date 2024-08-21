import * as chai from "chai";
import { LinearRing, MultiPoint, MultiPolygon, Point, Polygon } from "../geom";
import { Tolerance } from "../Tolerance";
import { InvalidCoordinateError } from "../coordinate";
import { AffineTransformer } from "../transformer/AffineTransformer";
import { A_OUTSIDE_B, B_OUTSIDE_A, DISJOINT, TOUCH } from "../Relation";
import { EmptyError } from "./EmptyError";

const expect = chai.expect;
const TOLERANCE = new Tolerance(0.1);
const A = new Polygon(new LinearRing([0, 0, 100, 0, 100, 100, 0, 100]));
const B = A.transform(AffineTransformer.IDENTITY.translate(150, 0));

export const multiPolygonSpec = () => {
  it("constructor requires at least 1 polygon", () => {
    expect(() => {
      new MultiPolygon([]);
    }).to.throw(EmptyError);
  });
  it("getCentroid returns and caches the centroid", () => {
    const multiPolygon = new MultiPolygon([A, B]);
    const centroid = multiPolygon.getCentroid();
    expect(centroid.toWkt()).to.equal("POINT(130 50)");
    expect(multiPolygon.getCentroid()).to.equal(centroid);
  });
  it("normalizes successfully", () => {
    const multiPolygon = new MultiPolygon([A, B]);
    expect(multiPolygon.isNormalized()).to.equal(true);
    const normalized = multiPolygon.normalize();
    expect(multiPolygon.normalize()).to.equal(normalized);
    expect(normalized.normalize()).to.equal(normalized);
    const wrongPolygonOrder = new MultiPolygon([B, A]);
    expect(wrongPolygonOrder.isNormalized()).to.equal(false);
    expect(wrongPolygonOrder.normalize().toWkt()).to.equal(
      "MULTIPOLYGON(((0 0, 100 0, 100 100, 0 100, 0 0)),((150 0, 250 0, 250 100, 150 100, 150 0)))",
    );
    const wrongCoordinateOrder = new MultiPolygon([
      A,
      new Polygon(new LinearRing([150, 0, 150, 100, 250, 100, 250, 0])),
    ]);
    expect(wrongCoordinateOrder.isNormalized()).to.equal(false);
    expect(wrongCoordinateOrder.normalize().toWkt()).to.equal(
      "MULTIPOLYGON(((0 0, 100 0, 100 100, 0 100, 0 0)),((150 0, 250 0, 250 100, 150 100, 150 0)))",
    );
  });
  it("returns GeoJson", () => {
    const multiPolygon = new MultiPolygon([A, B]);
    expect(multiPolygon.toGeoJson()).to.eql({
      type: "MultiPolygon",
      coordinates: [
        [[[0, 0], [100, 0], [100, 100], [0, 100], [0, 0]]],
        [[[150, 0], [250, 0], [250, 100], [150, 100], [150, 0]]]
      ],
    });
  });
  it("validates successfully", () => {
    expect(new MultiPolygon([A, B]).isValid(TOLERANCE)).to.equal(true)
    expect(new MultiPolygon([A, B]).isValid(new Tolerance(300))).to.equal(false)
    expect(new MultiPolygon([B, A]).isValid(TOLERANCE)).to.equal(true)
    expect(new MultiPolygon([A, new Polygon(new LinearRing([150, 0, 150, 100, 250, 0, 250, 100])),]).isValid(TOLERANCE)).to.equal(false)
    expect(new MultiPolygon([A, A]).isValid(TOLERANCE)).to.equal(false)
  });
};
