import * as chai from "chai";
import { calculateZOrder, ZOrderIndex } from "./ZOrderIndex";
import { Tolerance } from "../Tolerance";
import { Point, Rectangle } from "../geom";
import { assert } from "chai";

const expect = chai.expect;
const ORIGIN = Point.ORIGIN;

export const zOrderIndexSpec = () => {
  it("calculates Z Orders as expected", () => {
    expect(calculateZOrder(1, 0, ORIGIN, 0.1)).to.equal(BigInt(68));
    expect(calculateZOrder(0, 1, ORIGIN, 0.1)).to.equal(BigInt(136));
    expect(calculateZOrder(2, 1, ORIGIN, 0.1)).to.equal(BigInt(408));
    expect(calculateZOrder(2, 3, ORIGIN, 0.1)).to.equal(BigInt(952));
  });

  it("creates Z Orders that sort", () => {
    for (let i = 0; i < 10; i++) {
      const a = Number(calculateZOrder(i, 0, ORIGIN, 0.1));
      const b = Number(calculateZOrder(i + 1, 0, ORIGIN, 0.1));
      const c = Number(calculateZOrder(i, 1, ORIGIN, 0.1));
      const d = Number(calculateZOrder(i + 1, 1, ORIGIN, 0.1));
      expect(a).to.be.below(d);
      expect(a).to.be.below(b);
      expect(a).to.be.below(c);
      expect(b).to.be.below(d);
      expect(c).to.be.below(d);
      // NOTE: We do not assert b < c
    }
  });

  it("will nto create a z order for a value below the minimum", () => {
    expect(() => {
      calculateZOrder(-0.1, 0, ORIGIN, 0.1);
    }).to.throw(Error);
    expect(() => {
      calculateZOrder(0, -0.1, ORIGIN, 0.1);
    }).to.throw(Error);
  });

  it("Loads non overlapping data", () => {
    const index = new ZOrderIndex(new Tolerance(0.05));
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        index.add(new Rectangle(i, j, i + 1, j + 1), `${i}:${j}`);
      }
    }
    const results = [];
    index.findIntersecting(new Rectangle(2, 3, 3, 4), (value, rectangle) => {
      expect(value).to.equal(`${rectangle.minX}:${rectangle.minY}`);
      results.push(value);
    });
    results.sort();
    expect(results).to.eql([
      "1:2",
      "1:3",
      "1:4",
      "2:2",
      "2:3",
      "2:4",
      "3:2",
      "3:3",
      "3:4",
    ]);
  });

  it("Loads data which overlaps at the max", () => {
    const index = new ZOrderIndex(new Tolerance(0.05));
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        index.add(new Rectangle(i, j, 6, 6), `${i}:${j}`);
      }
    }
    const results = [];
    index.findIntersecting(new Rectangle(1, 1, 2, 2), (value, rectangle) => {
      expect(value).to.equal(`${rectangle.minX}:${rectangle.minY}`);
      results.push(value);
    });
    results.sort();
    expect(results).to.eql([
      "0:0",
      "0:1",
      "0:2",
      "1:0",
      "1:1",
      "1:2",
      "2:0",
      "2:1",
      "2:2",
    ]);
  });

  it("Loads data which overlaps at the min", () => {
    const index = new ZOrderIndex(new Tolerance(0.05));
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        index.add(new Rectangle(-1, -1, i + 1, j + 1), `${i}:${j}`);
      }
    }
    const results = [];
    index.findIntersecting(new Rectangle(2, 3, 3, 4), (value) => {
      results.push(value);
    });
    results.sort();
    expect(results).to.eql([
      "1:2",
      "1:3",
      "1:4",
      "2:2",
      "2:3",
      "2:4",
      "3:2",
      "3:3",
      "3:4",
      "4:2",
      "4:3",
      "4:4",
    ]);
  });

  it("Loads nothing when there is no overlap", () => {
    const index = new ZOrderIndex(new Tolerance(0.05));
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        index.add(new Rectangle(0, 0, i + 1, j + 1), `${i}:${j}`);
      }
    }
    const results = [];
    index.findIntersecting(new Rectangle(6, 6, 7, 7), (value) => {
      results.push(value);
    });
    expect(results).to.eql([]);
    index.findIntersecting(new Rectangle(-2, -2, -1, -1), (value) => {
      results.push(value);
    });
    expect(results).to.eql([]);
  });

  it("Removes nodes successfully", () => {
    const index = new ZOrderIndex(new Tolerance(0.05));
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        index.add(new Rectangle(i, j, i + 1, j + 1), `${i}:${j}`);
      }
    }
    expect(index.remove(new Rectangle(1, 2, 2, 3), (value) => value === "1:2"))
      .to.be.true;
    expect(index.remove(new Rectangle(2, 3, 3, 4), (value) => value === "2:3"))
      .to.be.true;
    expect(index.remove(new Rectangle(1, 2, 2, 3), (value) => value === "1:2"))
      .to.be.false;
    const results = [];
    index.findIntersecting(new Rectangle(2, 3, 3, 4), (value, rectangle) => {
      expect(value).to.equal(`${rectangle.minX}:${rectangle.minY}`);
      results.push(value);
    });
    results.sort();
    expect(results).to.eql(["1:3", "1:4", "2:2", "2:4", "3:2", "3:3", "3:4"]);
  });

  it("empty index finds nothing", () => {
    const index = new ZOrderIndex(new Tolerance(0.05));
    index.findAll(() => {
      assert(false);
    });
    index.findIntersecting(new Rectangle(0, 0, 100, 100), () => {
      assert(false);
    });
  });

  it("stops finding when a consumer returns false", () => {
    const index = new ZOrderIndex(new Tolerance(0.05));
    for (let j = 0; j < 7; j++) {
      index.add(new Rectangle(0, j, 1, j + 1), j);
    }
    expect(
      index.findAll((value) => {
        expect(value).to.be.below(4);
        return value !== 3;
      }),
    ).to.equal(false);
    expect(
      index.findIntersecting(new Rectangle(0, 1.1, 1, 10), (value) => {
        expect(value).to.be.below(4);
        return value === 3;
      }),
    ).to.equal(false);
  });

  it("finds nodes as expected when searching", () => {
    const index = new ZOrderIndex(new Tolerance(0.05));
    for (let j = 0; j < 7; j += 2) {
      index.add(new Rectangle(0, j, 1, j + 1), j);
    }
    expect(
      index.findIntersecting(new Rectangle(1.05, 3.05, 2.05, 4.05), (value) => {
        throw new Error("unexpected_state");
      }),
    );
  });

  it("Still works when a preset min is provided", () => {
    const index = new ZOrderIndex(
      new Tolerance(0.05),
      Point.valueOf(-100, -100),
    );
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        index.add(new Rectangle(i, j, i + 1, j + 1), `${i}:${j}`);
      }
    }
    const results = [];
    index.findIntersecting(new Rectangle(2, 3, 3, 4), (value, rectangle) => {
      expect(value).to.equal(`${rectangle.minX}:${rectangle.minY}`);
      results.push(value);
    });
    results.sort();
    expect(results).to.eql([
      "1:2",
      "1:3",
      "1:4",
      "2:2",
      "2:3",
      "2:4",
      "3:2",
      "3:3",
      "3:4",
    ]);
  });
};
