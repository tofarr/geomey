import * as chai from "chai";
import { LineSegment, LineString, Point, Rectangle } from "../geom";
import { Tolerance } from "../Tolerance";
import { InvalidCoordinateError } from "../coordinate";
import { AffineTransformer } from "../transformer/AffineTransformer";
import { Transformer } from "../transformer/Transformer";
import { A_OUTSIDE_B, B_OUTSIDE_A, DISJOINT, OUTSIDE_TOUCH, TOUCH } from "../Relation";

const expect = chai.expect;
const TOLERANCE = new Tolerance(0.1);

export const lineSegmentSpec = () => {
  it("constructor throws an error when there is invalid coordinates", () => {
    expect(() => {
      new LineSegment(NaN, 2, 3, 4);
    }).to.throw(InvalidCoordinateError)
    expect(() => {
      new LineSegment(1, Infinity, 3, 4);
    }).to.throw(InvalidCoordinateError)
    expect(() => {
      new LineSegment(1, 2, Infinity, 4);
    }).to.throw(InvalidCoordinateError)
    expect(() => {
      new LineSegment(1, 2, 3, NaN);
    }).to.throw(InvalidCoordinateError)
  });
  it("constructor throws an error when the coordinates match", () => {
    expect(() => {
      new LineSegment(1, 2, 1, 2);
    }).to.throw(InvalidCoordinateError)
  });
  it("Line segment attributes calculated as expected", () => {
    const lineSegment = new LineSegment(10, 30, 20, 50);
    expect(lineSegment.getCentroid().toWkt()).to.equal("POINT(15 40)");
    expect(lineSegment.getInternalArea()).to.equal(null)
    expect(lineSegment.getDx()).to.equal(10)
    expect(lineSegment.getDy()).to.equal(20)
    expect(lineSegment.getSlope()).to.equal(2)
    expect(lineSegment.getLength()).to.equal(Math.sqrt(500))
  });
  it("generates GeoJson", () => {
    const lineString = new LineSegment(1, 3, 6, 8)
    const geoJson = { 
      type: "LineString", 
      coordinates: [
        [1,3],
        [6,8]
      ]
    };
    expect(lineString.toGeoJson()).to.eql(geoJson)
  });
  it("determines normalization successfully", () => {
    expect(new LineSegment(1, 3, 6, 8).isNormalized()).to.equal(true)
    expect(new LineSegment(1, 3, 1, 8).isNormalized()).to.equal(true)
    expect(new LineSegment(6, 8, 1, 3).isNormalized()).to.equal(false)
    expect(new LineSegment(6, 8, 6, 3).isNormalized()).to.equal(false)
  });
  it("validates at a tolerance", () => {
    const lineSegment = new LineSegment(1, 3, 2, 4)
    expect(lineSegment.isValid(new Tolerance(0.5))).to.equal(true)
    expect(lineSegment.isValid(new Tolerance(4))).to.equal(false)
  });
  it("normalizes successfully", () => {
    expect(new LineSegment(1, 3, 6, 8).normalize().toWkt()).to.equal("LINESTRING(1 3, 6 8)")
    expect(new LineSegment(1, 3, 1, 8).normalize().toWkt()).to.equal("LINESTRING(1 3, 1 8)")
    expect(new LineSegment(6, 8, 1, 3).normalize().toWkt()).to.equal("LINESTRING(1 3, 6 8)")
    expect(new LineSegment(6, 8, 6, 3).normalize().toWkt()).to.equal("LINESTRING(6 3, 6 8)")
  });
  it("transform successfully", () => {
    expect(new LineSegment(1, 3, 6, 8).transform(AffineTransformer.IDENTITY.rotateDegrees(90)).toWkt()).to.equal("LINESTRING(-3 1, -8 6)")
  });
  it("const transformer transforms to point", () => {
    class ConstTransformer implements Transformer {
      transform(x: number, y: number): [number, number] {
        return [1, 1]
      }
      transformAll(coordinates: ReadonlyArray<number>) {
        return coordinates.map(() => 1)
      }
    }
    expect(new LineSegment(1, 3, 6, 8).transform(new ConstTransformer()).toWkt()).to.equal("POINT(1 1)")
  });
  it("generalizes successfully", () => {
    const lineSegment = new LineSegment(1, 3, 6, 8)
    expect(lineSegment.generalize(new Tolerance(0.1))).to.equal(lineSegment);
    expect(lineSegment.generalize(new Tolerance(5)).toWkt()).to.equal("POINT(3.5 5.5)");
  });
  it("relates to other Point successfully", () => {
    const lineSegment = new LineSegment(0, 2, 6, 8)
    expect(lineSegment.relate(Point.valueOf(2, 0), TOLERANCE)).to.equal(DISJOINT);
    expect(lineSegment.relate(Point.valueOf(0, 2), TOLERANCE)).to.equal(A_OUTSIDE_B | TOUCH);
    expect(lineSegment.relate(Point.valueOf(6, 8), TOLERANCE)).to.equal(A_OUTSIDE_B | TOUCH);
    expect(lineSegment.relate(Point.valueOf(16, 8), TOLERANCE)).to.equal(DISJOINT);
  });
  it("relates to other LineSegment successfully", () => {
    const lineSegment = new LineSegment(0, 2, 6, 8)
    expect(lineSegment.relate(new LineSegment(2, 0, 8, 6), TOLERANCE)).to.equal(DISJOINT);
    expect(lineSegment.relate(new LineSegment(2, 0, 4, 8), TOLERANCE)).to.equal(OUTSIDE_TOUCH);
    expect(lineSegment.relate(new LineSegment(0, 2, 6, 8), TOLERANCE)).to.equal(TOUCH);
    expect(lineSegment.relate(new LineSegment(6, 8, 0, 8), TOLERANCE)).to.equal(OUTSIDE_TOUCH);
    expect(lineSegment.relate(new LineSegment(0, 2, 8, 2), TOLERANCE)).to.equal(OUTSIDE_TOUCH);
    expect(lineSegment.relate(new LineSegment(12, 0, 18, 6), TOLERANCE)).to.equal(DISJOINT);
  });
  it("relates to other LineString successfully", () => {
    const lineSegment = new LineSegment(0, 2, 6, 8)
    const lineString = new LineString([2, 2, 2, 6, 6, 6])
    expect(lineSegment.relate(lineString, TOLERANCE)).to.equal(OUTSIDE_TOUCH);
  });
  it("union successfully", () => {
    const lineSegment = new LineSegment(0, 2, 6, 8)
    const rectangle = new Rectangle(2, 2, 6, 6)
    expect(lineSegment.union(lineSegment, TOLERANCE).toWkt()).to.equal("LINESTRING(0 2, 6 8)");
    expect(lineSegment.union(rectangle, TOLERANCE).toWkt()).to.equal("GEOMETRYCOLLECTION(POLYGON((2 2, 6 2, 6 6, 4 6, 2 6, 2 4, 2 2)),LINESTRING(0 2, 2 4),LINESTRING(4 6, 6 8))");
    expect(lineSegment.union(new LineSegment(4, 6, 8, 10), TOLERANCE).toWkt()).to.equal("LINESTRING(0 2, 6 8)");
  });
  it("intersection successfully", () => {
    const lineSegment = new LineSegment(0, 2, 6, 8)
    const rectangle = new Rectangle(2, 2, 6, 6)
    expect(lineSegment.intersection(lineSegment, TOLERANCE).toWkt()).to.equal("LINESTRING(0 2, 6 8)");
    expect(lineSegment.intersection(rectangle, TOLERANCE).toWkt()).to.equal("LINESTRING(2 4, 4 6)");

    expect(lineSegment.intersection(new LineSegment(4, 6, 8, 10), TOLERANCE).toWkt()).to.equal("LINESTRING(0 2, 6 8)");
  });
  /*
  it("creates rectangles successfully", () => {
    const rectangle = new Rectangle(1, 2, 3, 4);
    expect(rectangle.minX).to.equal(1);
    expect(rectangle.minY).to.equal(2);
    expect(rectangle.maxX).to.equal(3);
    expect(rectangle.maxY).to.equal(4);
    expect(rectangle.getBounds()).to.equal(rectangle)
    expect(rectangle.isValid()).to.equal(true)
    expect(rectangle.isNormalized()).to.equal(true)
  });
  it("sorts rectangle coordinates", () => {
    const rectangle = new Rectangle(3, 4, 1, 2);
    expect(rectangle.minX).to.equal(1);
    expect(rectangle.minY).to.equal(2);
    expect(rectangle.maxX).to.equal(3);
    expect(rectangle.maxY).to.equal(4);
  });
  it("builds rectangle from coordinates", () => {
    const coordinates = [...Array(10).keys()];
    const rectangle = Rectangle.valueOf(coordinates);
    expect(rectangle.minX).to.equal(0);
    expect(rectangle.minY).to.equal(1);
    expect(rectangle.maxX).to.equal(8);
    expect(rectangle.maxY).to.equal(9);
  });
  it("empty coordinates returns null", () => {
    const rectangle = Rectangle.valueOf([]);
    expect(rectangle).to.equal(null);
  });
  it("gets centroid", () => {
    const coordinates = [...Array(10).keys()];
    const rectangle = Rectangle.valueOf(coordinates);
    const centroid = rectangle.getCentroid();
    expect(centroid.toWkt()).to.equal("POINT(4 5)");
    expect(rectangle.getCentroid()).to.equal(centroid)
  });
  it("gets width, height and area", () => {
    const rectangle = new Rectangle(2, 20, 10, 40);
    expect(rectangle.getCentroid().toWkt()).to.equal("POINT(6 30)");
    expect(rectangle.getWidth()).to.equal(8);
    expect(rectangle.getHeight()).to.equal(20);
    expect(rectangle.getArea()).to.equal(160);
  });
  it("can be collapsed ", () => {
    expect(new Rectangle(2, 5, 2, 5).isCollapsible(TOLERANCE)).to.equal(true);
    expect(new Rectangle(2, 5, 2.05, 5.05).isCollapsible(TOLERANCE)).to.equal(true);
    expect(new Rectangle(2, 5, 2.15, 5.05).isCollapsible(TOLERANCE)).to.equal(false);
    expect(new Rectangle(2, 5, 2.05, 5.15).isCollapsible(TOLERANCE)).to.equal(false);
    expect(new Rectangle(2, 5, 2.15, 5.15).isCollapsible(TOLERANCE)).to.equal(false);
  });
  it("can walk paths", () => {
    const rectangle = new Rectangle(1, 3, 6, 8)
    const walker = new SVGPathWalker();
    rectangle.walkPath(walker);
    expect(walker.toPath()).to.equal("M1 3L6 3 6 8 1 8Z");
  });
  it("generates wkt", () => {
    const rectangle = new Rectangle(1, 3, 6, 8)
    expect(rectangle.toWkt()).to.equal("POLYGON((1 3, 6 3, 6 8, 1 8, 1 3))")
    const format = new Intl.NumberFormat("en", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format;
    expect(rectangle.toWkt(format)).to.equal("POLYGON((1.0 3.0, 6.0 3.0, 6.0 8.0, 1.0 8.0, 1.0 3.0))")
  });
  it("generates GeoJson", () => {
    const rectangle = new Rectangle(1, 3, 6, 8)
    const geoJson = { 
      type: "Polygon", 
      coordinates: [[
        [1,3],
        [6,3],
        [6,8],
        [1,8],
        [1,3]
      ]]
    };
    expect(rectangle.toGeoJson()).to.eql(geoJson)
  });
  it("generates coordinates", () => {
    const rectangle = new Rectangle(1, 3, 6, 8)
    const coordinates = [1,3, 6,3, 6,8, 1,8]
    expect(rectangle.toCoordinates()).to.eql(coordinates)
  });
  it("creates polygon", () => {
    const rectangle = new Rectangle(1, 3, 6, 8)
    const polygon = rectangle.getPolygon()
    expect(polygon.toWkt()).to.eql("POLYGON((1 3, 6 3, 6 8, 1 8, 1 3))")
  });
  it("creates normalized versions of geometry", () => {
    expect(new Rectangle(1, 3, 6, 8).normalize().toWkt()).to.equal("POLYGON((1 3, 6 3, 6 8, 1 8, 1 3))")
    expect(new Rectangle(1, 3, 1, 8).normalize().toWkt()).to.equal("LINESTRING(1 3, 1 8)")
    expect(new Rectangle(1, 3, 6, 3).normalize().toWkt()).to.equal("LINESTRING(1 3, 6 3)")
    expect(new Rectangle(1, 3, 1, 3).normalize().toWkt()).to.equal("POINT(1 3)")
  });
  it("creates transformed versions", () => {
    const transformer = AffineTransformer.IDENTITY.scaleAround(2, 4, 5)
    expect(new Rectangle(1, 3, 6, 8).transform(transformer).toCoordinates()).to.eql([-2, 1, 8, 1, 8, 11, -2, 11])
  });
  it("creates generalized versions", () => {
    expect(new Rectangle(1, 3, 6, 8).generalize(new Tolerance(0.1)).toWkt()).to.equal("POLYGON((1 3, 6 3, 6 8, 1 8, 1 3))")
    expect(new Rectangle(1, 3, 6, 8).generalize(new Tolerance(6)).toWkt()).to.equal("POINT(3.5 5.5)")
  });
  it("creates instersects point", () => {
    const rectangle = new Rectangle(1, 3, 6, 8);
    
    expect(rectangle.instersectsPoint(1, 3)).to.equal(true);
    expect(rectangle.instersectsPoint(4, 3)).to.equal(true);
    expect(rectangle.instersectsPoint(6, 3)).to.equal(true);

    expect(rectangle.instersectsPoint(1, 5)).to.equal(true);
    expect(rectangle.instersectsPoint(6, 5)).to.equal(true);

    expect(rectangle.instersectsPoint(1, 8)).to.equal(true);
    expect(rectangle.instersectsPoint(4, 8)).to.equal(true);
    expect(rectangle.instersectsPoint(6, 8)).to.equal(true);

    expect(rectangle.instersectsPoint(0, 2)).to.equal(false);
    expect(rectangle.instersectsPoint(0, 3)).to.equal(false);
    expect(rectangle.instersectsPoint(1, 2)).to.equal(false);

    expect(rectangle.instersectsPoint(6, 9)).to.equal(false);
    expect(rectangle.instersectsPoint(7, 8)).to.equal(false);
    expect(rectangle.instersectsPoint(7, 9)).to.equal(false);
  });
  it("creates instersects rectangle", () => {
    const rectangle = new Rectangle(1, 3, 6, 8);
    
    expect(rectangle.intersectsRectangle(new Rectangle(1, 3, 2, 4))).to.equal(true);
    expect(rectangle.intersectsRectangle(new Rectangle(4, 3, 5, 4))).to.equal(true);
    expect(rectangle.intersectsRectangle(new Rectangle(6, 3, 7, 4))).to.equal(true);

    expect(rectangle.intersectsRectangle(new Rectangle(1, 5, 2, 6))).to.equal(true);
    expect(rectangle.intersectsRectangle(new Rectangle(6, 5, 7, 6))).to.equal(true);

    expect(rectangle.intersectsRectangle(new Rectangle(1, 8, 2, 9))).to.equal(true);
    expect(rectangle.intersectsRectangle(new Rectangle(4, 8, 5, 9))).to.equal(true);
    expect(rectangle.intersectsRectangle(new Rectangle(6, 8, 7, 9))).to.equal(true);

    expect(rectangle.intersectsRectangle(new Rectangle(1, 1, 6, 2))).to.equal(false);
    expect(rectangle.intersectsRectangle(new Rectangle(1, 9, 6, 10))).to.equal(false);
    expect(rectangle.intersectsRectangle(new Rectangle(1, 1, 6, 2))).to.equal(false);
    expect(rectangle.intersectsRectangle(new Rectangle(1, 9, 6, 10))).to.equal(false);
  });
  it("relates to point", () => {
    const rectangle = new Rectangle(1, 3, 6, 8);
    
    expect(rectangle.relatePoint(1, 3, TOLERANCE)).to.equal(TOUCH | A_OUTSIDE_B);
    expect(rectangle.relatePoint(4, 3, TOLERANCE)).to.equal(TOUCH | A_OUTSIDE_B);
    expect(rectangle.relatePoint(6, 3, TOLERANCE)).to.equal(TOUCH | A_OUTSIDE_B);

    expect(rectangle.relatePoint(1, 5, TOLERANCE)).to.equal(TOUCH | A_OUTSIDE_B);
    expect(rectangle.relatePoint(6, 5, TOLERANCE)).to.equal(TOUCH | A_OUTSIDE_B);

    expect(rectangle.relatePoint(1, 8, TOLERANCE)).to.equal(TOUCH | A_OUTSIDE_B);
    expect(rectangle.relatePoint(4, 8, TOLERANCE)).to.equal(TOUCH | A_OUTSIDE_B);
    expect(rectangle.relatePoint(6, 8, TOLERANCE)).to.equal(TOUCH | A_OUTSIDE_B);

    expect(new Rectangle(1, 3, 1, 8).relatePoint(1, 3, TOLERANCE)).to.equal(TOUCH | A_OUTSIDE_B);
    expect(new Rectangle(1, 3, 1, 8).relatePoint(1, 8, TOLERANCE)).to.equal(TOUCH | A_OUTSIDE_B);

    expect(new Rectangle(1, 3, 6, 3).relatePoint(1, 3, TOLERANCE)).to.equal(TOUCH | A_OUTSIDE_B);
    expect(new Rectangle(1, 3, 6, 3).relatePoint(6, 3, TOLERANCE)).to.equal(TOUCH | A_OUTSIDE_B);

    expect(new Rectangle(1, 3, 1, 3).relatePoint(1, 3, TOLERANCE)).to.equal(TOUCH);
    expect(new Rectangle(1, 3, 1, 3).relatePoint(6, 8, TOLERANCE)).to.equal(DISJOINT);

    expect(rectangle.relatePoint(3, 6, TOLERANCE)).to.equal(A_OUTSIDE_B | B_INSIDE_A);

    expect(rectangle.relatePoint(0, 2, TOLERANCE)).to.equal(A_OUTSIDE_B | B_OUTSIDE_A);
    expect(rectangle.relatePoint(0, 3, TOLERANCE)).to.equal(A_OUTSIDE_B | B_OUTSIDE_A);
    expect(rectangle.relatePoint(1, 2, TOLERANCE)).to.equal(A_OUTSIDE_B | B_OUTSIDE_A);

    expect(rectangle.relatePoint(6, 9, TOLERANCE)).to.equal(A_OUTSIDE_B | B_OUTSIDE_A);
    expect(rectangle.relatePoint(7, 8, TOLERANCE)).to.equal(A_OUTSIDE_B | B_OUTSIDE_A);
    expect(rectangle.relatePoint(7, 9, TOLERANCE)).to.equal(A_OUTSIDE_B | B_OUTSIDE_A);
  });
  it("is disjoint rectangle", () => {
    const rectangle = new Rectangle(1, 3, 6, 8);
    
    expect(rectangle.isDisjointRectangle(new Rectangle(1, 3, 2, 4), TOLERANCE)).to.equal(false);
    expect(rectangle.isDisjointRectangle(new Rectangle(4, 3, 5, 4), TOLERANCE)).to.equal(false);
    expect(rectangle.isDisjointRectangle(new Rectangle(6, 3, 7, 4), TOLERANCE)).to.equal(false);

    expect(rectangle.isDisjointRectangle(new Rectangle(1, 5, 2, 6), TOLERANCE)).to.equal(false);
    expect(rectangle.isDisjointRectangle(new Rectangle(6, 5, 7, 6), TOLERANCE)).to.equal(false);

    expect(rectangle.isDisjointRectangle(new Rectangle(1, 8, 2, 9), TOLERANCE)).to.equal(false);
    expect(rectangle.isDisjointRectangle(new Rectangle(4, 8, 5, 9), TOLERANCE)).to.equal(false);
    expect(rectangle.isDisjointRectangle(new Rectangle(6, 8, 7, 9), TOLERANCE)).to.equal(false);

    expect(rectangle.isDisjointRectangle(new Rectangle(1, 1, 6, 2), TOLERANCE)).to.equal(true);
    expect(rectangle.isDisjointRectangle(new Rectangle(1, 9, 6, 10), TOLERANCE)).to.equal(true);
    expect(rectangle.isDisjointRectangle(new Rectangle(1, 1, 6, 2), TOLERANCE)).to.equal(true);
    expect(rectangle.isDisjointRectangle(new Rectangle(1, 9, 6, 10), TOLERANCE)).to.equal(true);
  });
  it("relates rectangle", () => {
    const rectangle = new Rectangle(1, 3, 6, 8);
    expect(rectangle.relateRectangle(new Rectangle(1, 3, 2, 4), TOLERANCE)).to.equal(A_INSIDE_B | A_OUTSIDE_B | B_INSIDE_A | TOUCH);
    expect(rectangle.relateRectangle(new Rectangle(4, 3, 5, 4), TOLERANCE)).to.equal(A_INSIDE_B | A_OUTSIDE_B | B_INSIDE_A | TOUCH);
    expect(rectangle.relateRectangle(new Rectangle(6, 3, 7, 4), TOLERANCE)).to.equal(OUTSIDE_TOUCH);

    expect(rectangle.relateRectangle(new Rectangle(1, 5, 2, 6), TOLERANCE)).to.equal(A_INSIDE_B | A_OUTSIDE_B | B_INSIDE_A | TOUCH);
    expect(rectangle.relateRectangle(new Rectangle(6, 5, 7, 6), TOLERANCE)).to.equal(OUTSIDE_TOUCH);

    expect(rectangle.relateRectangle(new Rectangle(1, 8, 2, 9), TOLERANCE)).to.equal(OUTSIDE_TOUCH);
    expect(rectangle.relateRectangle(new Rectangle(4, 8, 5, 9), TOLERANCE)).to.equal(OUTSIDE_TOUCH);
    expect(rectangle.relateRectangle(new Rectangle(6, 8, 7, 9), TOLERANCE)).to.equal(OUTSIDE_TOUCH);

    expect(rectangle.relateRectangle(new Rectangle(1, 1, 6, 2), TOLERANCE)).to.equal(DISJOINT);
    expect(rectangle.relateRectangle(new Rectangle(1, 9, 6, 10), TOLERANCE)).to.equal(DISJOINT);
    expect(rectangle.relateRectangle(new Rectangle(-1, 3, 0, 8), TOLERANCE)).to.equal(DISJOINT);
    expect(rectangle.relateRectangle(new Rectangle(7, 3, 8, 8), TOLERANCE)).to.equal(DISJOINT);

    expect(rectangle.relateRectangle(new Rectangle(0, 2, 7, 9), TOLERANCE)).to.equal(A_INSIDE_B | B_INSIDE_A | B_OUTSIDE_A);
  });

  it("unions as expected", () => {
    const a = new Rectangle(1, 3, 6, 8);
    const b = new Rectangle(12, 13, 14, 16)
    expect(a.union(b).toWkt()).to.equal("POLYGON((1 3, 14 3, 14 16, 1 16, 1 3))")
    expect(b.union(a).toWkt()).to.equal("POLYGON((1 3, 14 3, 14 16, 1 16, 1 3))")
  })

  it("intersection as expected", () => {
    const a = new Rectangle(1, 3, 6, 8);
    expect(a.intersection(a, TOLERANCE).toWkt()).to.equal("POLYGON((1 3, 6 3, 6 8, 1 8, 1 3))")
    const b = new Rectangle(2, 4, 8, 10)
    expect(a.intersection(b, TOLERANCE).toWkt()).to.equal("POLYGON((2 4, 6 4, 6 8, 2 8, 2 4))")
    expect(b.intersection(a, TOLERANCE).toWkt()).to.equal("POLYGON((2 4, 6 4, 6 8, 2 8, 2 4))")
    expect(a.intersection(new Rectangle(7, 3, 8, 8), TOLERANCE)).to.equal(null)
  })

  it("less as expected", () => {
    const a = new Rectangle(1, 3, 6, 8);
    expect(a.less(a, TOLERANCE)).to.equal(null)
    const b = new Rectangle(2, 4, 8, 10)
    expect(a.less(b, TOLERANCE).toWkt()).to.equal("POLYGON((1 3, 6 3, 6 4, 2 4, 2 8, 1 8, 1 3))")
    expect(b.less(a, TOLERANCE).toWkt()).to.equal("POLYGON((2 8, 6 8, 6 4, 8 4, 8 10, 2 10, 2 8))")
    expect(a.less(new Rectangle(1, 3, 4, 8), TOLERANCE).toWkt()).to.equal("POLYGON((4 3, 6 3, 6 8, 4 8, 4 3))")
    expect(a.less(new Rectangle(3, 3, 6, 8), TOLERANCE).toWkt()).to.equal("POLYGON((1 3, 3 3, 3 8, 1 8, 1 3))")
    expect(a.less(new Rectangle(2, 3, 5, 8), TOLERANCE).toWkt()).to.equal("MULTIPOLYGON(((1 3, 2 3, 2 8, 1 8, 1 3)),((5 3, 6 3, 6 8, 5 8, 5 3)))")
    expect(a.less(new Rectangle(2, 4, 5, 7), TOLERANCE).toWkt()).to.equal("POLYGON((1 3, 6 3, 6 8, 1 8, 1 3),(2 4, 2 7, 5 7, 5 4, 2 4))")
    expect(a.less(new Rectangle(7, 3, 8, 8), TOLERANCE)).to.equal(a)
  })


  it("xor as expected", () => {
    const a = new Rectangle(1, 3, 6, 8);
    expect(a.xor(a, TOLERANCE)).to.equal(null)
    const b = new Rectangle(2, 4, 8, 10)
    expect(a.xor(b, TOLERANCE).toWkt()).to.equal("MULTIPOLYGON(((1 3, 6 3, 6 4, 2 4, 2 8, 1 8, 1 3)),((2 8, 6 8, 6 4, 8 4, 8 10, 2 10, 2 8)))")
    expect(b.xor(a, TOLERANCE).toWkt()).to.equal("MULTIPOLYGON(((1 3, 6 3, 6 4, 2 4, 2 8, 1 8, 1 3)),((2 8, 6 8, 6 4, 8 4, 8 10, 2 10, 2 8)))")
    
    expect(a.xor(new Rectangle(1, 3, 4, 8), TOLERANCE).toWkt()).to.equal("POLYGON((4 3, 6 3, 6 8, 4 8, 4 3))")
    expect(a.xor(new Rectangle(3, 3, 6, 8), TOLERANCE).toWkt()).to.equal("POLYGON((1 3, 3 3, 3 8, 1 8, 1 3))")
    expect(a.xor(new Rectangle(2, 3, 5, 8), TOLERANCE).toWkt()).to.equal("MULTIPOLYGON(((1 3, 2 3, 2 8, 1 8, 1 3)),((5 3, 6 3, 6 8, 5 8, 5 3)))")
    expect(a.xor(new Rectangle(2, 2, 5, 9), TOLERANCE).toWkt()).to.equal("MULTIPOLYGON(((1 3, 2 3, 2 8, 1 8, 1 3)),((2 2, 5 2, 5 3, 2 3, 2 2)),((2 8, 5 8, 5 9, 2 9, 2 8)),((5 3, 6 3, 6 8, 5 8, 5 3)))")
    expect(a.xor(new Rectangle(2, 4, 5, 7), TOLERANCE).toWkt()).to.equal("POLYGON((1 3, 6 3, 6 8, 1 8, 1 3),(2 4, 2 7, 5 7, 5 4, 2 4))")
    expect(a.xor(new Rectangle(7, 3, 8, 8), TOLERANCE).toWkt()).to.equal("MULTIPOLYGON(((1 3, 6 3, 6 8, 1 8, 1 3)),((7 3, 8 3, 8 8, 7 8, 7 3)))")
  })
  */
};
