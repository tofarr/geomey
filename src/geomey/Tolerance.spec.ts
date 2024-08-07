import * as chai from "chai";
import { Tolerance } from "./Tolerance";

const expect = chai.expect;

export const toleranceSpec = () => {
  it("does not allow tolerances to be 0", () => {
    expect(() => {
      new Tolerance(0);
    }).to.throw(Error);
  });

  it("does not allow tolerances less than 0", () => {
    expect(() => {
      new Tolerance(-0.01);
    }).to.throw(Error);
  });

  it("does not allow non numeric tolerances", () => {
    expect(() => {
      new Tolerance(NaN);
    }).to.throw(Error);
  });
};
