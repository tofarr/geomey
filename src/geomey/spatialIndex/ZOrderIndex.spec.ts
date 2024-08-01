import * as chai from "chai";
import { calculateZOrder, ZOrderIndex } from "./ZOrderIndex";
import { Tolerance } from "../Tolerance";
import { Rectangle } from "../geom";

const expect = chai.expect;


export const zOrderIndexSpec = () => {

  it("calculates Z Orders as expected", () => {
    expect(calculateZOrder(1, 0, 0.1)).to.equal(BigInt(68))
    expect(calculateZOrder(0, 1, 0.1)).to.equal(BigInt(136))
    expect(calculateZOrder(2, 1, 0.1)).to.equal(BigInt(408))
    expect(calculateZOrder(2, 3, 0.1)).to.equal(BigInt(952))
  })

  it("creates Z Orders that sort", () => {
    for(let i = 0; i < 10; i++){
        const a = Number(calculateZOrder(i, 0, 0.1))
        const b = Number(calculateZOrder(i+1, 0, 0.1))
        const c = Number(calculateZOrder(i, 1, 0.1))
        const d = Number(calculateZOrder(i+1, 1, 0.1))
        expect(a).to.be.below(d)
        expect(a).to.be.below(b)
        expect(a).to.be.below(c)
        expect(b).to.be.below(d)
        expect(c).to.be.below(d)
        // NOTE: We do not assert b < c
    }
  })
  
  it("Loads overlapping data", () => {
    const index = new ZOrderIndex(new Tolerance(0.05))
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            index.add(Rectangle.unsafeValueOf(i, j, i+1, j+1), `${i}:${j}`)
        }
    }
    const results = []
    index.findIntersecting(Rectangle.unsafeValueOf(1, 1, 2, 2), (value, rectangle) => {
        expect(value).to.equal(`${rectangle.minX}:${rectangle.minY}`)
        results.push(value)
    })
    results.sort()
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
    ])
  })
  
  it("Loads data which overlaps at the max", () => {
    const index = new ZOrderIndex(new Tolerance(0.05))
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            index.add(Rectangle.unsafeValueOf(i, j, 6, 6), `${i}:${j}`)
        }
    }
    const results = []
    index.findIntersecting(Rectangle.unsafeValueOf(1, 1, 2, 2), (value, rectangle) => {
        expect(value).to.equal(`${rectangle.minX}:${rectangle.minY}`)
        results.push(value)
    })
    results.sort()
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
    ])
  })


  it("Loads data which overlaps at the min", () => {
    const index = new ZOrderIndex(new Tolerance(0.05))
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            index.add(Rectangle.unsafeValueOf(0, 0, i+1, j+1), `${i}:${j}`)
        }
    }
    const results = []
    index.findIntersecting(Rectangle.unsafeValueOf(2, 3, 3, 4), (value, rectangle) => {
        results.push(value)
    })
    results.sort()
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
    ])
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
    debugger;
    const parsed = parseWkt(wkt, new Tolerance(0.05));
    const rendered = parsed.toWkt();
    expect(rendered).to.equal(wkt);
  });
  */
};
