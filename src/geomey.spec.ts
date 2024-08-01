import * as chai from "chai";
import { parseWkt } from "./geomey/parser/WktParser";
import { Tolerance } from "./geomey/Tolerance";
import { zOrderIndexSpec } from "./geomey/spatialIndex/ZOrderIndex.spec";


describe("ZOrderIndex", zOrderIndexSpec)


const expect = chai.expect;
describe("Geomey", () => {
  
  it("Dummy Test", () => {
    expect(1).to.equal(1)
  })
/*
  it("simple linestring", () => {
    const wkt = "LINESTRING (0 0, 100 0, 100 100, 0 100)";
    const parsed = parseWkt(wkt);
    const rendered = parsed.toWkt();
    expect(rendered).to.equal(wkt);
  });

  it("unvalidated self intersecting linestring", () => {
    const wkt = "LINESTRING (0 50, 100 50, 100 100, 50 100, 50 0)";
    const parsed = parseWkt(wkt);
    const rendered = parsed.toWkt();
    expect(rendered).to.equal(wkt);
  });

  it("validated self intersecting linestring", () => {
    const wkt = "LINESTRING (0 50, 100 50, 100 100, 50 100, 50 0)";
    const parsed = parseWkt(wkt, new Tolerance(0.05));
    const rendered = parsed.toWkt();
    expect(rendered).to.equal(wkt);
  });
*/
});
