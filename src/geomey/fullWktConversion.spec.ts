// import * as mocha from 'mocha';
import * as chai from "chai";
import { parseWkt } from "./parser/WktParser";

const expect = chai.expect;
describe("Full WKT Conversion", () => {
  it("simple linestring", () => {
    const wkt = "LINESTRING(0 0, 100, 0, 100, 100, 0, 100)";
    const parsed = parseWkt(wkt);
    const rendered = parsed.toWkt();
    expect(rendered).to.equal(wkt);
  });
});
