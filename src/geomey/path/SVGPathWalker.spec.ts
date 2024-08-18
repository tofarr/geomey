import * as chai from "chai";
import { Tolerance } from "../Tolerance";
import { LineString } from "../geom";
import { SVGPathWalker } from "./SVGPathWalker";

const expect = chai.expect;

export const svgPathWalkerSpec = () => {
  it("adds bezier curves as lines", () => {
    const walker = new SVGPathWalker();
    walker.moveTo(0, 0);
    walker.bezierCurveTo(0, 1, 1, 0, 1, 1);
    const path = walker.toPath();
    expect(path).to.equal("M0 0C0 1 1 0 1 1");
  });
};
