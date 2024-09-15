import * as chai from "chai";
import {
  intersectionLineSegment,
  LineSegment,
  LineString,
  Point,
  pointTouchesLineSegment,
  Rectangle,
} from "../geom";
import { Tolerance } from "../Tolerance";
import { InvalidCoordinateError } from "../coordinate";
import { AffineTransformer } from "../transformer/AffineTransformer";
import { Transformer } from "../transformer/Transformer";
import { A_OUTSIDE_B, DISJOINT, OUTSIDE_TOUCH, TOUCH } from "../Relation";

const expect = chai.expect;
const TOLERANCE = new Tolerance(0.1);

export const lineSegmentSpec = () => {
  it("constructor throws an error when there is invalid coordinates", () => {
    expect(() => {
      new LineSegment(NaN, 2, 3, 4);
    }).to.throw(InvalidCoordinateError);
    expect(() => {
      new LineSegment(1, Infinity, 3, 4);
    }).to.throw(InvalidCoordinateError);
    expect(() => {
      new LineSegment(1, 2, Infinity, 4);
    }).to.throw(InvalidCoordinateError);
    expect(() => {
      new LineSegment(1, 2, 3, NaN);
    }).to.throw(InvalidCoordinateError);
  });
  it("constructor throws an error when the coordinates match", () => {
    expect(() => {
      new LineSegment(1, 2, 1, 2);
    }).to.throw(InvalidCoordinateError);
  });
  it("Line segment attributes calculated as expected", () => {
    const lineSegment = new LineSegment(10, 30, 20, 50);
    const centroid = lineSegment.getCentroid();
    expect(centroid.toWkt()).to.equal("POINT(15 40)");
    expect(lineSegment.getCentroid()).to.equal(centroid);
    expect(lineSegment.getInternalArea()).to.equal(null);
    expect(lineSegment.getDx()).to.equal(10);
    expect(lineSegment.getDy()).to.equal(20);
    expect(lineSegment.getSlope()).to.equal(2);
    expect(lineSegment.getLength()).to.equal(Math.sqrt(500));
  });
  it("generates GeoJson", () => {
    const lineString = new LineSegment(1, 3, 6, 8);
    const geoJson = {
      type: "LineString",
      coordinates: [
        [1, 3],
        [6, 8],
      ],
    };
    expect(lineString.toGeoJson()).to.eql(geoJson);
  });
  it("determines normalization successfully", () => {
    expect(new LineSegment(1, 3, 6, 8).isNormalized()).to.equal(true);
    expect(new LineSegment(1, 3, 1, 8).isNormalized()).to.equal(true);
    expect(new LineSegment(6, 8, 1, 3).isNormalized()).to.equal(false);
    expect(new LineSegment(6, 8, 6, 3).isNormalized()).to.equal(false);
  });
  it("validates at a tolerance", () => {
    const lineSegment = new LineSegment(1, 3, 2, 4);
    expect(lineSegment.isValid(new Tolerance(0.5))).to.equal(true);
    expect(lineSegment.isValid(new Tolerance(4))).to.equal(false);
  });
  it("normalizes successfully", () => {
    expect(new LineSegment(1, 3, 6, 8).normalize().toWkt()).to.equal(
      "LINESTRING(1 3, 6 8)",
    );
    expect(new LineSegment(1, 3, 1, 8).normalize().toWkt()).to.equal(
      "LINESTRING(1 3, 1 8)",
    );
    expect(new LineSegment(6, 8, 1, 3).normalize().toWkt()).to.equal(
      "LINESTRING(1 3, 6 8)",
    );
    expect(new LineSegment(6, 8, 6, 3).normalize().toWkt()).to.equal(
      "LINESTRING(6 3, 6 8)",
    );
  });
  it("transform successfully", () => {
    expect(
      new LineSegment(1, 3, 6, 8)
        .transform(AffineTransformer.IDENTITY.rotateDegrees(90))
        .toWkt(),
    ).to.equal("LINESTRING(-3 1, -8 6)");
  });
  it("const transformer transforms to point", () => {
    class ConstTransformer implements Transformer {
      transform(): [number, number] {
        return [1, 1];
      }
      transformAll(coordinates: ReadonlyArray<number>) {
        return coordinates.map(() => 1);
      }
    }
    expect(
      new LineSegment(1, 3, 6, 8).transform(new ConstTransformer()).toWkt(),
    ).to.equal("POINT(1 1)");
  });
  it("generalizes successfully", () => {
    const lineSegment = new LineSegment(1, 3, 6, 8);
    expect(lineSegment.generalize(new Tolerance(0.1))).to.equal(lineSegment);
    expect(lineSegment.generalize(new Tolerance(5)).toWkt()).to.equal(
      "POINT(3.5 5.5)",
    );
  });
  it("relates to other Point successfully", () => {
    const lineSegment = new LineSegment(0, 2, 6, 8);
    expect(lineSegment.relate(Point.valueOf(2, 0), TOLERANCE)).to.equal(
      DISJOINT,
    );
    expect(lineSegment.relate(Point.valueOf(0, 2), TOLERANCE)).to.equal(
      A_OUTSIDE_B | TOUCH,
    );
    expect(lineSegment.relate(Point.valueOf(6, 8), TOLERANCE)).to.equal(
      A_OUTSIDE_B | TOUCH,
    );
    expect(lineSegment.relate(Point.valueOf(16, 8), TOLERANCE)).to.equal(
      DISJOINT,
    );
  });
  it("relates to other LineSegment successfully", () => {
    const lineSegment = new LineSegment(0, 2, 6, 8);
    expect(lineSegment.relate(new LineSegment(2, 0, 8, 6), TOLERANCE)).to.equal(
      DISJOINT,
    );
    expect(lineSegment.relate(new LineSegment(2, 0, 4, 8), TOLERANCE)).to.equal(
      OUTSIDE_TOUCH,
    );
    expect(lineSegment.relate(new LineSegment(0, 2, 6, 8), TOLERANCE)).to.equal(
      TOUCH,
    );
    expect(lineSegment.relate(new LineSegment(6, 8, 0, 8), TOLERANCE)).to.equal(
      OUTSIDE_TOUCH,
    );
    expect(lineSegment.relate(new LineSegment(0, 2, 8, 2), TOLERANCE)).to.equal(
      OUTSIDE_TOUCH,
    );
    expect(
      lineSegment.relate(new LineSegment(12, 0, 18, 6), TOLERANCE),
    ).to.equal(DISJOINT);
  });
  it("relates to other LineString successfully", () => {
    const lineSegment = new LineSegment(0, 2, 6, 8);
    const lineString = new LineString([2, 2, 2, 6, 6, 6]);
    expect(lineSegment.relate(lineString, TOLERANCE)).to.equal(OUTSIDE_TOUCH);
  });
  it("union successfully", () => {
    const lineSegment = new LineSegment(0, 2, 6, 8);
    const rectangle = new Rectangle(2, 2, 6, 6);
    expect(lineSegment.union(lineSegment, TOLERANCE).toWkt()).to.equal(
      "LINESTRING(0 2, 6 8)",
    );
    expect(lineSegment.union(rectangle, TOLERANCE).toWkt()).to.equal(
      "GEOMETRYCOLLECTION(POLYGON((2 2, 6 2, 6 6, 4 6, 2 6, 2 4, 2 2)),LINESTRING(0 2, 2 4),LINESTRING(4 6, 6 8))",
    );
    expect(
      lineSegment.union(new LineSegment(4, 6, 8, 10), TOLERANCE).toWkt(),
    ).to.equal("LINESTRING(0 2, 4 6, 6 8, 8 10)");
  });
  it("intersection successfully", () => {
    const lineSegment = new LineSegment(0, 2, 6, 8);
    const rectangle = new Rectangle(2, 2, 6, 6);
    expect(lineSegment.intersection(lineSegment, TOLERANCE).toWkt()).to.equal(
      "LINESTRING(0 2, 6 8)",
    );
    expect(lineSegment.intersection(rectangle, TOLERANCE).toWkt()).to.equal(
      "LINESTRING(2 4, 4 6)",
    );
    expect(
      lineSegment.intersection(new LineSegment(4, 6, 8, 10), TOLERANCE).toWkt(),
    ).to.equal("LINESTRING(4 6, 6 8)");
    expect(
      new LineSegment(4, 6, 8, 10)
        .intersection(new LineSegment(4, 10, 8, 6), TOLERANCE)
        .toWkt(),
    ).to.equal("POINT(6 8)");
    expect(
      lineSegment.intersection(new LineSegment(4, 6, 8, 10), TOLERANCE).toWkt(),
    ).to.equal("LINESTRING(4 6, 6 8)");
  });
  it("less successfully", () => {
    const lineSegment = new LineSegment(0, 2, 6, 8);
    const rectangle = new Rectangle(2, 2, 6, 6);
    expect(lineSegment.less(lineSegment, TOLERANCE)).to.equal(null);
    expect(lineSegment.less(rectangle, TOLERANCE).toWkt()).to.equal(
      "MULTILINESTRING((0 2, 2 4),(4 6, 6 8))",
    );
    expect(
      lineSegment.less(new LineSegment(4, 6, 8, 10), TOLERANCE).toWkt(),
    ).to.equal("LINESTRING(0 2, 4 6)");
    expect(
      new LineSegment(4, 6, 8, 10)
        .less(new LineSegment(4, 10, 8, 6), TOLERANCE)
        .toWkt(),
    ).to.equal("LINESTRING(4 6, 6 8, 8 10)");
  });
  it("xor successfully", () => {
    const lineSegment = new LineSegment(0, 2, 6, 8);
    const rectangle = new Rectangle(2, 2, 6, 6);
    expect(lineSegment.xor(lineSegment, TOLERANCE)).to.equal(null);
    expect(lineSegment.xor(rectangle, TOLERANCE).toWkt()).to.equal(
      "GEOMETRYCOLLECTION(POLYGON((2 2, 6 2, 6 6, 4 6, 2 6, 2 4, 2 2)),LINESTRING(0 2, 2 4),LINESTRING(4 6, 6 8))",
    );
    expect(
      lineSegment.xor(new LineSegment(4, 6, 8, 10), TOLERANCE).toWkt(),
    ).to.equal("MULTILINESTRING((0 2, 4 6),(6 8, 8 10))");
    expect(
      new LineSegment(4, 6, 8, 10)
        .xor(new LineSegment(4, 10, 8, 6), TOLERANCE)
        .toWkt(),
    ).to.equal(
      "MULTILINESTRING((4 6, 6 8),(4 10, 6 8),(6 8, 8 6),(6 8, 8 10))",
    );
  });
  it("point touches line segment is expected", () => {
    expect(pointTouchesLineSegment(0, 2, 0, 2, 6, 8, TOLERANCE)).to.equal(true);
    expect(pointTouchesLineSegment(-0.01, 2, 0, 2, 6, 8, TOLERANCE)).to.equal(
      true,
    );
    expect(pointTouchesLineSegment(6, 8, 0, 2, 6, 8, TOLERANCE)).to.equal(true);
    expect(pointTouchesLineSegment(0.01, 2, 0, 2, 6, 8, TOLERANCE)).to.equal(
      true,
    );
    expect(pointTouchesLineSegment(6, 8.01, 0, 2, 6, 8, TOLERANCE)).to.equal(
      true,
    );
    expect(pointTouchesLineSegment(0, 2, 0, 2, 6.01, 8, TOLERANCE)).to.equal(
      true,
    );
    expect(pointTouchesLineSegment(6, 8, 0, 2, 6, 8.01, TOLERANCE)).to.equal(
      true,
    );
    expect(pointTouchesLineSegment(3, 4, 0, 2, 6, 8, TOLERANCE)).to.equal(
      false,
    );
    expect(pointTouchesLineSegment(3, 4.01, 0, 2, 6, 8, TOLERANCE)).to.equal(
      false,
    );
    expect(pointTouchesLineSegment(4, 4, 0, 2, 6, 8, TOLERANCE)).to.equal(
      false,
    );
  });

  it("intersections works at end of line segments", () => {
    expect(
      intersectionLineSegment(0, 0, 2, 0, 0, 0, 0, 2, TOLERANCE).toWkt(),
    ).to.eql("POINT(0 0)");
    expect(
      intersectionLineSegment(2, 0, 0, 0, 0, 2, 0, 0, TOLERANCE).toWkt(),
    ).to.eql("POINT(0 0)");
    expect(
      intersectionLineSegment(0, 0, 2, 0, 2, 0, 2, 2, TOLERANCE).toWkt(),
    ).to.eql("POINT(2 0)");
    expect(
      intersectionLineSegment(0, 2, 2, 2, 2, 0, 2, 2, TOLERANCE).toWkt(),
    ).to.eql("POINT(2 2)");
    expect(
      intersectionLineSegment(0, 0, 2, 0, 1, 0, 1, 2, TOLERANCE).toWkt(),
    ).to.eql("POINT(1 0)");
    expect(
      intersectionLineSegment(0, 2, 2, 2, 1, 0, 1, 2, TOLERANCE).toWkt(),
    ).to.eql("POINT(1 2)");
    expect(
      intersectionLineSegment(0, 0, 0, 50, 0, 100, 50, 50, TOLERANCE)
    ).to.eql(null);
    expect(
      intersectionLineSegment(0, 50, 40, 50, 0, 100, 50, 50, TOLERANCE),
    ).to.eql(null);
    expect(
      intersectionLineSegment(0, 0, 2, 0, 0, -1, 0, 1, TOLERANCE).toWkt(),
    ).to.eql("POINT(0 0)");
    expect(
      intersectionLineSegment(0, 0, 2, 0, 2, -1, 2, 1, TOLERANCE).toWkt(),
    ).to.eql("POINT(2 0)");
    expect(
      intersectionLineSegment(0, 0, 2, 0, 2, -2, 2, 0, TOLERANCE).toWkt(),
    ).to.eql("POINT(2 0)");

    expect(
      intersectionLineSegment(0, 0, 2, 2, 0.01, -2, 0.02, 0, TOLERANCE).toWkt(),
    ).to.eql("POINT(0 0)");
    expect(
      intersectionLineSegment(0, 0, 2, 0, 0, 0.01, 0, 2, TOLERANCE).toWkt(),
    ).to.eql("POINT(0 0)");
    expect(
      intersectionLineSegment(0, 0, 2, 0, 0, -0.01, 0, -2, TOLERANCE).toWkt(),
    ).to.eql("POINT(0 -0.01)");
    expect(
      intersectionLineSegment(
        0,
        0,
        2,
        0,
        0.01,
        -0.01,
        0.01,
        -2,
        TOLERANCE,
      ).toWkt(),
    ).to.eql("POINT(0 0)");
    expect(
      intersectionLineSegment(0, 0, 2, 0, 0.01, -2, 0.01, 1, TOLERANCE).toWkt(),
    ).to.eql("POINT(0 0)");
    expect(
      intersectionLineSegment(0, 0, 2, 0, 0.01, -2, 0.01, -0.2, TOLERANCE),
    ).to.equal(null);
  });
};
