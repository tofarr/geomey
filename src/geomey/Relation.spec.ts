import * as chai from "chai";
import {
  A_INSIDE_B,
  A_OUTSIDE_B,
  ALL,
  B_INSIDE_A,
  B_OUTSIDE_A,
  flipAB,
  Relation,
  TOUCH,
  UNKNOWN,
} from "./Relation";

const expect = chai.expect;

export const relationSpec = () => {
  it("flipAB flips relation", () => {
    expect(flipAB(UNKNOWN)).to.equal(UNKNOWN);
    expect(flipAB(ALL)).to.equal(ALL);
    expect(flipAB(A_INSIDE_B)).to.equal(B_INSIDE_A);
    expect(flipAB(B_INSIDE_A)).to.equal(A_INSIDE_B);
    expect(flipAB(A_OUTSIDE_B)).to.equal(B_OUTSIDE_A);
    expect(flipAB(B_OUTSIDE_A)).to.equal(A_OUTSIDE_B);
    expect(flipAB(TOUCH)).to.equal(TOUCH);
    expect(flipAB((A_INSIDE_B | A_OUTSIDE_B) as Relation)).to.equal(
      B_INSIDE_A | B_OUTSIDE_A,
    );
    expect(flipAB((B_INSIDE_A | B_OUTSIDE_A) as Relation)).to.equal(
      A_INSIDE_B | A_OUTSIDE_B,
    );
  });
};
