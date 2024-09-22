import * as chai from "chai";
import { Tolerance } from "../../Tolerance";
import { parseWkt } from "../../parser/WktParser";
import { generalizeAgainst } from "./generalizeAgainst";

const expect = chai.expect;

export const generalizeAgainstSpec = () => {
  it("generalizes polygons against each other", () => {
    const tolerance = new Tolerance(0.1);
    const generalizeTolerance = new Tolerance(2.1);
    const geomA = parseWkt(
      "POLYGON((0 0, 50 0, 49 10, 51 20, 49 30, 51 40, 50 50, 0 50))",
    );
    const geomB = parseWkt(
      "POLYGON((100 0, 50 0, 51 10, 49 20, 51 30, 49 40, 50 50, 100 50))",
    );
    const generalizedA = generalizeAgainst(
      geomA,
      generalizeTolerance,
      tolerance,
      geomB,
    );
    const resultA = generalizedA.toWkt();
    const generalizedB = generalizeAgainst(
      geomB,
      generalizeTolerance,
      tolerance,
      geomA,
    );
    const resultB = generalizedB.toWkt();
    expect(resultA).to.equal("POLYGON((0 0, 50 0, 50 50, 0 50, 0 0))");
    expect(resultB).to.equal("POLYGON((50 0, 100 0, 100 50, 50 50, 50 0))");
  });
};
