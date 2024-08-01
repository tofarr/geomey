import * as chai from "chai";
import { Rectangle } from "../geom";
import { RTree } from "./RTree";

const expect = chai.expect;


export const rTreeSpec = () => {

  it("Loads non overlapping data", () => {
    const index = new RTree()
    for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
            index.add(Rectangle.unsafeValueOf(i, j, i+1, j+1), `${i}:${j}`)
        }
    }
    const results = []
    index.findIntersecting(Rectangle.unsafeValueOf(2, 3, 3, 4), (value, rectangle) => {
        expect(value).to.equal(`${rectangle.minX}:${rectangle.minY}`)
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
    ])
  })

  it("Loads data which overlaps at the max", () => {
    const index = new RTree()
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
    const index = new RTree()
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            index.add(Rectangle.unsafeValueOf(-1, -1, i+1, j+1), `${i}:${j}`)
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

  it("Loads nothing when there is no overlap", () => {
    const index = new RTree()
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            index.add(Rectangle.unsafeValueOf(0, 0, i+1, j+1), `${i}:${j}`)
        }
    }
    const results = []
    index.findIntersecting(Rectangle.unsafeValueOf(6, 6, 7, 7), (value, rectangle) => {
        results.push(value)
    })
    expect(results).to.eql([])
    index.findIntersecting(Rectangle.unsafeValueOf(-2, -2, -1, -1), (value, rectangle) => {
        results.push(value)
    })
    expect(results).to.eql([])
  })

  it("Removes nodes successfully", () => {
    const index = new RTree()
    for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
            index.add(Rectangle.unsafeValueOf(i, j, i+1, j+1), `${i}:${j}`)
        }
    }
    expect(index.remove(Rectangle.unsafeValueOf(1, 2, 2, 3), value => value === "1:2")).to.be.true
    expect(index.remove(Rectangle.unsafeValueOf(2, 3, 3, 4), value => value === "2:3")).to.be.true
    expect(index.remove(Rectangle.unsafeValueOf(1, 2, 2, 3), value => value === "1:2")).to.be.false
    const results = []
    index.findIntersecting(Rectangle.unsafeValueOf(2, 3, 3, 4), (value, rectangle) => {
        expect(value).to.equal(`${rectangle.minX}:${rectangle.minY}`)
        results.push(value)
    })
    results.sort()
    expect(results).to.eql([
        "1:3",
        "1:4",
        "2:2",
        "2:4",
        "3:2",
        "3:3",
        "3:4",
    ])
  })

};
