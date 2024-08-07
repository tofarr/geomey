import * as chai from "chai";
import { Point } from "./Point";
import { Tolerance } from "../Tolerance";
import { A_OUTSIDE_B, B_OUTSIDE_A, DISJOINT, TOUCH } from "../Relation";
import { LineSegment } from "./LineSegment";
import { MultiPoint } from "./MultiPoint";

const expect = chai.expect;
const TOLERANCE = new Tolerance(0.05);

export const relateSpec = () => {
  it("point touches to itself", () => {
    const a = Point.valueOf(1, 2);
    expect(a.relate(a, TOLERANCE)).to.equal(TOUCH);
  });

  it("point touches point within tolerance", () => {
    const a = Point.valueOf(1, 2);
    const b = Point.valueOf(1.01, 2.01);
    expect(a.relate(b, TOLERANCE)).to.equal(TOUCH);
  });

  it("point is disjoint from point outside tolerance X", () => {
    const a = Point.valueOf(1, 2);
    const b = Point.valueOf(1.06, 2.01);
    expect(a.relate(b, TOLERANCE)).to.equal(DISJOINT);
  });

  it("point is disjoint from point outside tolerance Y", () => {
    const a = Point.valueOf(1, 2);
    const b = Point.valueOf(1.01, 2.06);
    expect(a.relate(b, TOLERANCE)).to.equal(DISJOINT);
  });

  it("line segment touches point", () => {
    const a = new LineSegment(0, 0, 10, 10);
    const b = Point.valueOf(4.99, 4.98);
    expect(a.relate(b, TOLERANCE)).to.equal(A_OUTSIDE_B | TOUCH);
    expect(b.relate(a, TOLERANCE)).to.equal(B_OUTSIDE_A | TOUCH);
  });

  it("line segment disjoint from point", () => {
    const a = new LineSegment(0, 0, 10, 10);
    const b = Point.valueOf(4, 5);
    expect(a.relate(b, TOLERANCE)).to.equal(DISJOINT);
    expect(b.relate(a, TOLERANCE)).to.equal(DISJOINT);
  });

  it("line segment touches itself", () => {
    const a = new LineSegment(1, 2, 3, 4);
    expect(a.relate(a, TOLERANCE)).to.equal(TOUCH);
  });

  it("line segment is inside another", () => {
    const a = new LineSegment(0, 0, 10, 10);
    const b = new LineSegment(1, 1, 8, 8);
    expect(a.relate(b, TOLERANCE)).to.equal(TOUCH | A_OUTSIDE_B);
    expect(b.relate(a, TOLERANCE)).to.equal(TOUCH | B_OUTSIDE_A);
  });

  it("line segment overlaps another", () => {
    const a = new LineSegment(0, 0, 7, 7);
    const b = new LineSegment(3, 3, 10, 10);
    expect(a.relate(b, TOLERANCE)).to.equal(
      TOUCH | A_OUTSIDE_B | B_OUTSIDE_A,
    );
  });

  it("line segment intersects another", () => {
    const a = new LineSegment(7, 0, 0, 7);
    const b = new LineSegment(3, 3, 10, 10);
    expect(a.relate(b, TOLERANCE)).to.equal(
      TOUCH | A_OUTSIDE_B | B_OUTSIDE_A,
    );
  });

  it("multipoint disjoint from point", () => {
    const a = new MultiPoint([0, 7, 3, 4, 7, 0, 7, 7]);
    const b = Point.valueOf(0, 6);
    expect(a.relate(b, TOLERANCE)).to.equal(
      DISJOINT
    );
  });

  it("multipoint touches point", () => {
    const a = new MultiPoint([0, 7, 3, 4, 7, 0, 7, 7]);
    const b = Point.valueOf(3, 4);
    expect(a.relate(b, TOLERANCE)).to.equal(
      A_OUTSIDE_B | TOUCH
    );
    expect(b.relate(a, TOLERANCE)).to.equal(
        B_OUTSIDE_A | TOUCH
      );
  });

  it("multipoint single touches point", () => {
    const a = new MultiPoint([3, 4]);
    const b = Point.valueOf(3, 4.01);
    expect(a.relate(b, TOLERANCE)).to.equal(TOUCH);
    expect(b.relate(a, TOLERANCE)).to.equal(TOUCH);
  });

  it("multipoint single disjoint point", () => {
    const a = new MultiPoint([3, 4]);
    const b = Point.valueOf(3.06, 4);
    expect(a.relate(b, TOLERANCE)).to.equal(DISJOINT);
    expect(b.relate(a, TOLERANCE)).to.equal(DISJOINT);
  });

  it("multipoint touches self", () => {
    const a = new MultiPoint([0, 7, 3, 4, 7, 0, 7, 7]);
    expect(a.relate(a, TOLERANCE)).to.equal(TOUCH);
  });

  it("multipoint touches line segment", () => {
    const a = new MultiPoint([0, 0, 10, 10]);
    const b = new LineSegment(0, 0, 10, 10)
    expect(a.relate(b, TOLERANCE)).to.equal(TOUCH | B_OUTSIDE_A);
    expect(b.relate(a, TOLERANCE)).to.equal(TOUCH | A_OUTSIDE_B);
  });

  it("multipoint disjoint line segment", () => {
    const a = new MultiPoint([0, 0, 10, 10]);
    const b = new LineSegment(1, 1, 9, 9)
    expect(a.relate(b, TOLERANCE)).to.equal(DISJOINT);
    expect(b.relate(a, TOLERANCE)).to.equal(DISJOINT);
  });
};
