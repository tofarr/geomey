import * as chai from "chai";
import { Point } from "./Point";
import { LinearRing } from "./LinearRing";

const expect = chai.expect;

export const linearRingSpec = () => {
  it("getConvexRings does not split convex rings", () => {
    const ring = new LinearRing([0, 0, 100, 0, 0, 100, 0, 100]);
    const rings = ring.getConvexRings();
    expect(rings).to.eql([ring]);
  });
  it("getConvexRings splits non convex rings", () => {
    const ring = new LinearRing([0, 50, 100, 0, 50, 50, 100, 100]);
    const rings = ring.getConvexRings();
    expect(rings.length).to.equal(2);
    expect(rings[0].coordinates).to.eql([0, 50, 100, 0, 50, 50]);
    expect(rings[1].coordinates).to.eql([0, 50, 50, 50, 100, 100]);
  });
};
