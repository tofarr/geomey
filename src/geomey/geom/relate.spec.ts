import * as chai from "chai";
import { Point } from "./Point";
import { Tolerance } from "../Tolerance";
import { A_INSIDE_B, A_OUTSIDE_B, ALL, B_INSIDE_A, B_OUTSIDE_A, DISJOINT, TOUCH } from "../Relation";
import { LineSegment } from "./LineSegment";
import { MultiPoint } from "./MultiPoint";
import { LineString } from "./LineString";
import { forEachCoordinate } from "../coordinate";
import { MultiLineString } from "./MultiLineString";
import { LinearRing } from "./LinearRing";
import { Polygon } from "./Polygon";

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

  it("linestring touches point", () => {
    const a = new LineString([10, 0, 10, 10, 0, 10]);
    const points = [10, 0, 10, 5, 10, 10, 5, 10, 0, 10]
    forEachCoordinate(points, (x, y) => {
        const b = Point.valueOf(x, y)
        expect(a.relate(b, TOLERANCE)).to.equal((A_OUTSIDE_B | TOUCH));
        expect(b.relate(a, TOLERANCE)).to.equal((B_OUTSIDE_A | TOUCH));
        const c = Point.valueOf(x - 0.01, y + 0.01)
        expect(a.relate(c, TOLERANCE)).to.equal((A_OUTSIDE_B | TOUCH));
        expect(c.relate(a, TOLERANCE)).to.equal((B_OUTSIDE_A | TOUCH));
        const d = Point.valueOf(x + 1, y + 1)
        expect(a.relate(d, TOLERANCE)).to.equal(DISJOINT);
        expect(d.relate(a, TOLERANCE)).to.equal(DISJOINT);
    });
  });

  it("linestring touches multipoint", () => {
    const a = new LineString([10, 0, 10, 10, 0, 10]);
    const b = new MultiPoint([10, 0, 10, 10, 0, 10]);
    expect(a.relate(b, TOLERANCE)).to.equal((A_OUTSIDE_B | TOUCH));
    expect(b.relate(a, TOLERANCE)).to.equal((B_OUTSIDE_A | TOUCH));
    const c = new MultiPoint([10, 0, 10, 10, 10, 20]);
    expect(a.relate(c, TOLERANCE)).to.equal((A_OUTSIDE_B | B_OUTSIDE_A | TOUCH));
    expect(c.relate(a, TOLERANCE)).to.equal((A_OUTSIDE_B | B_OUTSIDE_A | TOUCH));
  });

  it("linestring touches linestring", () => {
    const a = new LineString([0, 0, 0, 10, 10, 10, 10, 0]);
    const b = new LineString([2, 0, 2, 10, 8, 10, 8, 0]);
    expect(a.relate(b, TOLERANCE)).to.equal((A_OUTSIDE_B | B_OUTSIDE_A | TOUCH));
    expect(b.relate(a, TOLERANCE)).to.equal((A_OUTSIDE_B | B_OUTSIDE_A | TOUCH));
    const c = new MultiPoint([0, 0, 0, 10, 10, 10, 10, 20]);
    expect(a.relate(c, TOLERANCE)).to.equal((A_OUTSIDE_B | B_OUTSIDE_A | TOUCH));
    expect(c.relate(a, TOLERANCE)).to.equal((A_OUTSIDE_B | B_OUTSIDE_A | TOUCH));
  });

  it("linestring intersects linestring", () => {
    const a = new LineString([0, 0, 0, 10, 10, 10, 10, 0]);
    const b = new LineString([5, 0, 5, 15, 15, 15]);
    expect(a.relate(b, TOLERANCE)).to.equal((A_OUTSIDE_B | B_OUTSIDE_A | TOUCH));
    expect(b.relate(a, TOLERANCE)).to.equal((A_OUTSIDE_B | B_OUTSIDE_A | TOUCH));
    const c = new LineString([5, 0, 10, 20, 20, 20]);
    expect(a.relate(c, TOLERANCE)).to.equal((A_OUTSIDE_B | B_OUTSIDE_A | TOUCH));
    expect(c.relate(a, TOLERANCE)).to.equal((A_OUTSIDE_B | B_OUTSIDE_A | TOUCH));
  });

  it("multilinestring intersects multilinestring", () => {
    const a = new MultiLineString([
        new LineString([0, 0, 0, 10, 10, 10, 10, 0]),
        new LineString([2, 0, 2, 8, 8, 8, 8, 2])
    ]);
    const b = new MultiLineString([
        new LineString([4, 14, 4, 4, 14, 4, 14, 14]),
        new LineString([16, 0, 16, 10, 18, 10])
    ]);
    expect(a.relate(b, TOLERANCE)).to.equal((A_OUTSIDE_B | B_OUTSIDE_A | TOUCH));
    expect(b.relate(a, TOLERANCE)).to.equal((A_OUTSIDE_B | B_OUTSIDE_A | TOUCH));
    const c = new MultiLineString([
        new LineString([16, 0, 16, 10, 18, 10])
    ]);
    expect(a.relate(c, TOLERANCE)).to.equal((DISJOINT));
    expect(c.relate(a, TOLERANCE)).to.equal((DISJOINT));
  });

  it("linearring contains lineString", () => {
    const a = new LinearRing([
        0, 0, 100, 0, 100, 100, 0, 100
    ]);
    const b = new LineString([
        20, 20, 80, 20, 80, 80, 20, 80
    ]);
    expect(a.relate(b, TOLERANCE)).to.equal(A_OUTSIDE_B | B_INSIDE_A);
    expect(b.relate(a, TOLERANCE)).to.equal(A_INSIDE_B | B_OUTSIDE_A);
  })

  it("linearring intersects lineString", () => {
    const a = new LinearRing([
        20, 20, 80, 20, 80, 80, 20, 80
    ]);
    const b = new LineString([
        0, 0, 0, 50, 100, 50, 
    ]);
    expect(a.relate(b, TOLERANCE)).to.equal(A_OUTSIDE_B | B_INSIDE_A | B_OUTSIDE_A | TOUCH);
    expect(b.relate(a, TOLERANCE)).to.equal(A_INSIDE_B | A_OUTSIDE_B | B_OUTSIDE_A | TOUCH);
  })

  it("linearring contains linearring", () => {
    const a = new LinearRing([
        0, 0, 100, 0, 100, 100, 0, 100
    ]);
    const b = new LinearRing([
        20, 20, 80, 20, 80, 80, 20, 80
    ]);
    expect(a.relate(b, TOLERANCE)).to.equal(A_INSIDE_B | A_OUTSIDE_B | B_INSIDE_A);
    expect(b.relate(a, TOLERANCE)).to.equal(A_INSIDE_B | B_INSIDE_A | B_OUTSIDE_A);
  });

  it("linearring intersects linearring", () => {
    const a = new LinearRing([
        0, 0, 100, 0, 100, 100, 0, 100
    ]);
    const b = new LinearRing([
        50, 50, 150, 50, 150, 150, 50, 150
    ]);
    expect(a.relate(b, TOLERANCE)).to.equal(ALL);
    expect(b.relate(a, TOLERANCE)).to.equal(ALL);
  });

  it("linearring disjoint linearring", () => {
    const a = new LinearRing([
        0, 0, 100, 0, 100, 100, 0, 100
    ]);
    const b = new LinearRing([
        200, 0, 300, 0, 300, 100, 200, 100
    ]);
    expect(a.relate(b, TOLERANCE)).to.equal(DISJOINT);
    expect(b.relate(a, TOLERANCE)).to.equal(DISJOINT);
  });

  it("linearring touch linearring", () => {
    const a = new LinearRing([
        0, 0, 100, 0, 100, 100, 0, 100
    ]);
    const b = new LinearRing([
        100, 0, 200, 0, 200, 100, 100, 100
    ]);
    expect(a.relate(b, TOLERANCE)).to.equal(A_OUTSIDE_B | B_OUTSIDE_A | TOUCH);
    expect(b.relate(a, TOLERANCE)).to.equal(A_OUTSIDE_B | B_OUTSIDE_A | TOUCH);
    const c = new LinearRing([
        100, 150, 200, 0, 200, 100
    ])
    expect(a.relate(b, TOLERANCE)).to.equal(A_OUTSIDE_B | B_OUTSIDE_A | TOUCH);
    expect(b.relate(a, TOLERANCE)).to.equal(A_OUTSIDE_B | B_OUTSIDE_A | TOUCH);
    
  });

  it("linearring touch inside linearring", () => {
    const a = new LinearRing([
        0, 0, 100, 0, 100, 100, 0, 100
    ]);
    const b = new LinearRing([
        0, 50, 50, 0, 100, 50, 50, 100
    ]);
    expect(a.relate(b, TOLERANCE)).to.equal(A_INSIDE_B | A_OUTSIDE_B | B_INSIDE_A | TOUCH);
    expect(b.relate(a, TOLERANCE)).to.equal(A_INSIDE_B | B_INSIDE_A | B_OUTSIDE_A | TOUCH);
  });

  it("polygon touches self", () => {
    const a = new Polygon(
        new LinearRing([0, 0, 100, 0, 100, 100, 0, 100]),
        [
            new LinearRing([20, 20, 80, 20, 80, 80, 20, 80])
        ]
    )
    expect(a.relate(a, TOLERANCE)).to.equal(TOUCH | A_INSIDE_B | B_INSIDE_A);
  });

  it("polygon intersect polygon", () => {
    // 2 Donuts
    const a = new Polygon(
        new LinearRing([0, 0, 100, 0, 100, 100, 0, 100]),
        [
            new LinearRing([20, 20, 80, 20, 80, 80, 20, 80])
        ]
    )
    const b = new Polygon(
        new LinearRing([50, 50, 150, 50, 150, 150, 50, 150]),
        [
            new LinearRing([70, 70, 130, 70, 130, 130, 70, 130])
        ]
    )
    expect(a.relate(b, TOLERANCE)).to.equal(ALL);
    expect(b.relate(a, TOLERANCE)).to.equal(ALL);
  });

  it("polygon contains polygon", () => {
    // 2 Donuts
    const a = new Polygon(
        new LinearRing([0, 0, 100, 0, 100, 100, 0, 100]),
        [
            new LinearRing([20, 20, 80, 20, 80, 80, 20, 80])
        ]
    )
    const b = new Polygon(
        new LinearRing([30, 30, 70, 30, 70, 70, 30, 70]),
        [
            new LinearRing([40, 40, 60, 40, 60, 60, 40, 60])
        ]
    )
    expect(a.relate(b, TOLERANCE)).to.equal(DISJOINT);
    expect(b.relate(a, TOLERANCE)).to.equal(DISJOINT);
  });
};
