// import * as mocha from 'mocha';
import * as chai from "chai";
// import { parseWkt } from "./parser/WktParser";
//import { IRectangle } from "./geom";

const expect = chai.expect;
describe("Full WKT Conversion", () => {
  it("dummy test", () => {
    //const bounds: IRectangle = { minX: 0, minY: 1, maxX: 2, maxY: 3 };
    expect(2).to.equal(1);
  });
  /*
  it("simple linestring", () => {
    const wkt = "LINESTRING (0 0, 100 0, 100 100, 0 100)";
    const parsed = parseWkt(wkt);
    const rendered = parsed.toWkt();
    expect(rendered).to.equal(wkt);
  });
  */
});
