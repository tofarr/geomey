import * as chai from "chai";
import { angle } from "./coordinate";

const expect = chai.expect;

export const coordinateSpec = () => {
  it("angle produces expected angle", () => {
    expect(angle(0, 0, 0, -1)).to.equal(0);
    expect(angle(0, 0, 1, -1)).to.equal(Math.PI / 4);
    expect(angle(0, 0, 1, 0)).to.equal(Math.PI / 2);
    expect(angle(0, 0, 1, 1)).to.equal((Math.PI * 3) / 4);
    expect(angle(0, 0, 0, 1)).to.equal(Math.PI);
    expect(angle(0, 0, -1, 1)).to.equal((Math.PI * 5) / 4);
    expect(angle(0, 0, -1, 0)).to.equal((Math.PI * 3) / 2);
    expect(angle(0, 0, -1, -1)).to.equal((Math.PI * 7) / 4);
  });
};
