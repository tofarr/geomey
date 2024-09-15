import * as chai from "chai";
import { Tolerance } from "../Tolerance";
import { MeshPathWalker } from "./MeshPathWalker";
import { LineString } from "../geom";

const expect = chai.expect;

export const meshPathWalkerSpec = () => {
  it("adds vertices", () => {
    const walker = MeshPathWalker.valueOf(new Tolerance(0.05));
    walker.moveTo(1, 2);
    walker.lineTo(1, 2);
    const [rings, linesAndPoints] = walker.getMeshes();
    expect(rings.getVertices()).to.eql([]);
    const vertices = linesAndPoints.getVertices();
    expect(vertices.length).to.equal(1);
    const vertex = vertices[0];
    expect(vertex.links).to.eql([]);
    expect(vertex.x).to.equal(1);
    expect(vertex.y).to.equal(2);
  });

  it("adds bezier curves as lines", () => {
    const walker = MeshPathWalker.valueOf(new Tolerance(0.1));
    walker.moveTo(0, 0);
    walker.bezierCurveTo(0, 1, 1, 0, 1, 1);
    const [rings, linesAndPoints] = walker.getMeshes();
    expect(rings.getVertices()).to.eql([]);
    const lineStrings = linesAndPoints.getLineStrings();
    expect(lineStrings.length).to.eql(1);
    const wkt = new LineString(lineStrings[0]).toWkt();
    expect(wkt).to.equal(
      "LINESTRING(0 0, 0 0.3, 0.2 0.4, 0.5 0.5, 0.7 0.5, 0.8 0.6, 1 0.7, 1 1)",
    );
  });

  it("xors links", () => {
    const walker = MeshPathWalker.valueOf(new Tolerance(0.05), true);
    for (let i = 0; i < 2; i++) {
      walker.moveTo(1, 2);
      walker.lineTo(5, 2);
      walker.lineTo(5, 4);
      walker.lineTo(1, 4);
      walker.closePath();
    }
    const [rings, linesAndPoints] = walker.getMeshes();
    expect(rings.getVertices().length).to.equal(4);
    expect(rings.getEdges().length).to.equal(0);
    expect(linesAndPoints.getEdges().length).to.equal(0);
  });
};
