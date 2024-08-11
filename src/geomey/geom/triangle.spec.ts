import * as chai from "chai";
import { Tolerance } from "../Tolerance";
import { parseWkt } from "../parser/WktParser";
import { Triangle } from "./Triangle";

const expect = chai.expect;
const TOLERANCE = new Tolerance(0.05);

export const triangleSpec = () => {
  it("valueOf produces an array of triangles", () => {
    const wkt = "POLYGON((0 0, 10 0, 10 10, 0 10, 0 2, 8 2, 8 8, 2 8, 2 4, 6 4, 6 6, 5 6, 5 5, 3 5, 3 7, 7 7, 7 3, 1 3, 1 9, 9 9, 9 1, 0 1))";
    const parsed = parseWkt(wkt);
    const triangles = Triangle.valueOf(parsed, TOLERANCE)
    expect(triangles).to.eql([]);
  });
};
