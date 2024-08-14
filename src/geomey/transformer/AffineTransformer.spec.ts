import * as chai from "chai";
import { AffineTransformer } from "./AffineTransformer";
import { coordinatesMatch } from "../coordinate";
import { Tolerance } from "../Tolerance";
import { assert } from "chai";

const expect = chai.expect;
const tolerance = new Tolerance(0.0001);

export const affineTransformerSpec = () => {
  it("prevents init with invalid parameters", () => {
    expect(() => {
      new AffineTransformer(Infinity, 0, 0, 0, 1, 0);
    }).to.throw(Error);
    expect(() => {
      new AffineTransformer(1, 0, 0, 0, 1, NaN);
    }).to.throw(Error);
    expect(() => {
      new AffineTransformer(1, 0, 0, 0, Infinity, 0);
    }).to.throw(Error);
  });
  it("identity transform does not modify coordinates", () => {
    expect(AffineTransformer.IDENTITY.transform(0, 0)).to.eql([0, 0]);
    expect(AffineTransformer.IDENTITY.transform(1, 2)).to.eql([1, 2]);
    expect(AffineTransformer.IDENTITY.transformAll([])).to.eql([]);
    expect(AffineTransformer.IDENTITY.transformAll([1, 2, 3, 4])).to.eql([
      1, 2, 3, 4,
    ]);
  });
  it("uniform scale transform scales uniformly", () => {
    const transform = AffineTransformer.IDENTITY.scale(2);
    expect(transform.transform(0, 0)).to.eql([0, 0]);
    expect(transform.transform(1, 2)).to.eql([2, 4]);
    expect(transform.transformAll([])).to.eql([]);
    expect(transform.transformAll([1, 2, 3, 4])).to.eql([2, 4, 6, 8]);
  });
  it("explicit scale by 0 throws an error", () => {
    expect(() => {
      AffineTransformer.IDENTITY.scale(0);
    }).to.throw(Error);
    expect(() => {
      AffineTransformer.IDENTITY.scale(2, 0);
    }).to.throw(Error);
    expect(() => {
      AffineTransformer.IDENTITY.scale(0, 2);
    }).to.throw(Error);
  });
  it("independent scale transform scales uniformly", () => {
    const transform = AffineTransformer.IDENTITY.scale(2, 3);
    expect(transform.transform(0, 0)).to.eql([0, 0]);
    expect(transform.transform(1, 2)).to.eql([2, 6]);
    expect(transform.transformAll([])).to.eql([]);
    expect(transform.transformAll([1, 2, 3, 4])).to.eql([2, 6, 6, 12]);
  });
  it("translate translates", () => {
    const transform = AffineTransformer.IDENTITY.translate(1, 2);
    expect(transform.transform(0, 0)).to.eql([1, 2]);
    expect(transform.transform(1, 2)).to.eql([2, 4]);
    expect(transform.transformAll([])).to.eql([]);
    expect(transform.transformAll([1, 2, 3, 4])).to.eql([2, 4, 4, 6]);
  });
  it("rotate rotates", () => {
    const transform = AffineTransformer.IDENTITY.rotateDegrees(45);
    const n = Math.cos(Math.PI / 4);
    assert(coordinatesMatch(transform.transform(1, 0), [n, n], tolerance));
    assert(coordinatesMatch(transform.transform(n, n), [0, 1], tolerance));
    assert(coordinatesMatch(transform.transform(0, 1), [-n, n], tolerance));
    assert(coordinatesMatch(transform.transform(-n, n), [-1, 0], tolerance));
    assert(coordinatesMatch(transform.transform(0, -1), [-n, -n], tolerance));
    assert(coordinatesMatch(transform.transform(-n, -n), [0, -1], tolerance));
    assert(coordinatesMatch(transform.transform(-1, 0), [n, -n], tolerance));
    assert(coordinatesMatch(transform.transform(-n, n), [1, 0], tolerance));
  });
  it("rotate 90 degree blocks rotates", () => {
    const transform = AffineTransformer.IDENTITY.rotateDegrees(90);
    expect(transform.transform(1, 0)).to.eql([0, 1]);
    expect(transform.transform(0, 1)).to.eql([-1, 0]);
    expect(transform.transform(-1, 0)).to.eql([0, -1]);
    expect(transform.transform(0, -1)).to.eql([1, 0]);
    expect(AffineTransformer.IDENTITY.rotateDegrees(0).transform(1, 0)).to.eql([
      1, 0,
    ]);
    expect(
      AffineTransformer.IDENTITY.rotateDegrees(180).transform(1, 0),
    ).to.eql([-1, 0]);
    expect(
      AffineTransformer.IDENTITY.rotateDegrees(270).transform(1, 0),
    ).to.eql([0, -1]);
  });
  it("rotates around points successfully", () => {
    const transform = AffineTransformer.IDENTITY.rotateDegrees(90, 1, 2);
    expect(transform.transform(1, 0)).to.eql([3, 2]);
    expect(transform.transform(0, 1)).to.eql([2, 1]);
    expect(transform.transform(-1, 0)).to.eql([3, 0]);
    expect(transform.transform(0, -1)).to.eql([4, 1]);
  });
  it("add combines matrices in the correct order", () => {
    const transform = AffineTransformer.IDENTITY.translate(1, 2).scale(2);
    expect(transform.transform(0, 0)).to.eql([2, 4]);
    expect(transform.transform(1, 2)).to.eql([4, 8]);
    expect(transform.transformAll([])).to.eql([]);
    expect(transform.transformAll([1, 2, 3, 4])).to.eql([4, 8, 8, 12]);
    const transform2 = AffineTransformer.IDENTITY.scale(2).translate(1, 2);
    expect(transform2.transform(0, 0)).to.eql([1, 2]);
    expect(transform2.transform(1, 2)).to.eql([3, 6]);
    expect(transform2.transformAll([])).to.eql([]);
    expect(transform2.transformAll([1, 2, 3, 4])).to.eql([3, 6, 7, 10]);
    const transform3 = AffineTransformer.IDENTITY.translate(-1, -2)
      .scale(2)
      .translate(1, 2);
    expect(transform3.transform(0, 0)).to.eql([-1, -2]);
    expect(transform3.transform(1, 2)).to.eql([1, 2]);
    expect(transform3.transformAll([])).to.eql([]);
    expect(transform3.transformAll([1, 2, 3, 4])).to.eql([1, 2, 5, 6]);
  });
  it("scale around scales around a point", () => {
    const transform = AffineTransformer.IDENTITY.scaleAround(2, 4, 8);
    expect(transform.transform(0, 0)).to.eql([-4, -8]);
    expect(transform.transform(1, 2)).to.eql([-2, -4]);
    expect(transform.transformAll([])).to.eql([]);
    expect(transform.transformAll([1, 2, 3, 4])).to.eql([-2, -4, 2, 0]);
  });
  it("get inverse inverts transformation", () => {
    const transform = AffineTransformer.IDENTITY.scaleAround(
      2,
      4,
      8,
    ).getInverse();
    expect(transform.transform(-4, -8)).to.eql([0, 0]);
    expect(transform.transform(-2, -4)).to.eql([1, 2]);
    expect(transform.transformAll([])).to.eql([]);
    expect(transform.transformAll([-2, -4, 2, 0])).to.eql([1, 2, 3, 4]);
  });
};
