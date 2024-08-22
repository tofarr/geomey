import * as chai from "chai";
import { Tolerance } from "../../Tolerance";
import { RectangleBuilder } from "./RectangleBuilder";
import { Rectangle } from "..";

const expect = chai.expect;
const TOLERANCE = new Tolerance(0.05);

export const rectangleBuilderSpec = () => {
  it("unions coordinates as expected", () => {
    const builder = new RectangleBuilder();
    builder.unionCoordinates([3, 4, 1, 5, 2, 6, 7, 5]);
    const rect = builder.build() as Rectangle;
    expect(rect.minX).to.equal(1);
    expect(rect.minY).to.equal(4);
    expect(rect.maxX).to.equal(7);
    expect(rect.maxY).to.equal(6);
  });
  it("resets as expected", () => {
    const builder = new RectangleBuilder(1, 2, 11, 12);
    builder.reset();
    builder.union(4, 7);
    builder.union(6, 5);
    const rect = builder.build() as Rectangle;
    expect(rect.minX).to.equal(4);
    expect(rect.minY).to.equal(5);
    expect(rect.maxX).to.equal(6);
    expect(rect.maxY).to.equal(7);
  });
  it("intersections as expected", () => {
    let coordinates = (
      new RectangleBuilder(1, 2, 11, 12)
        .intersection(new RectangleBuilder(5, 6, 15, 16))
        .build() as Rectangle
    ).toCoordinates();
    expect(coordinates).to.eql([1, 2, 15, 2, 15, 16, 1, 16]);
    coordinates = (
      new RectangleBuilder(1, 2, 15, 16)
        .intersection(new RectangleBuilder(5, 6, 15, 16))
        .build() as Rectangle
    ).toCoordinates();
    expect(coordinates).to.eql([1, 2, 15, 2, 15, 16, 1, 16]);
    coordinates = (
      new RectangleBuilder(5, 6, 15, 16)
        .intersection(new RectangleBuilder(1, 2, 15, 16))
        .build() as Rectangle
    ).toCoordinates();
    expect(coordinates).to.eql([1, 2, 15, 2, 15, 16, 1, 16]);
    coordinates = (
      new RectangleBuilder(1, 2, 15, 16)
        .intersection(new RectangleBuilder(5, 6, 11, 12))
        .build() as Rectangle
    ).toCoordinates();
    expect(coordinates).to.eql([1, 2, 15, 2, 15, 16, 1, 16]);
  });
  it("intersects points as expected", () => {
    expect(new RectangleBuilder(1, 2, 11, 12).intersectsPoint(0, 2)).to.eql(
      false,
    );
    expect(new RectangleBuilder(1, 2, 11, 12).intersectsPoint(0, 6)).to.eql(
      false,
    );
    expect(new RectangleBuilder(1, 2, 11, 12).intersectsPoint(0, 12)).to.eql(
      false,
    );

    expect(new RectangleBuilder(1, 2, 11, 12).intersectsPoint(1, 2)).to.eql(
      true,
    );
    expect(new RectangleBuilder(1, 2, 11, 12).intersectsPoint(1, 6)).to.eql(
      true,
    );
    expect(new RectangleBuilder(1, 2, 11, 12).intersectsPoint(1, 12)).to.eql(
      true,
    );

    expect(new RectangleBuilder(1, 2, 11, 12).intersectsPoint(5, 2)).to.eql(
      true,
    );
    expect(new RectangleBuilder(1, 2, 11, 12).intersectsPoint(5, 6)).to.eql(
      true,
    );
    expect(new RectangleBuilder(1, 2, 11, 12).intersectsPoint(5, 12)).to.eql(
      true,
    );

    expect(new RectangleBuilder(1, 2, 11, 12).intersectsPoint(11, 2)).to.eql(
      true,
    );
    expect(new RectangleBuilder(1, 2, 11, 12).intersectsPoint(11, 6)).to.eql(
      true,
    );
    expect(new RectangleBuilder(1, 2, 11, 12).intersectsPoint(11, 12)).to.eql(
      true,
    );

    expect(new RectangleBuilder(1, 2, 11, 12).intersectsPoint(12, 2)).to.eql(
      false,
    );
    expect(new RectangleBuilder(1, 2, 11, 12).intersectsPoint(12, 6)).to.eql(
      false,
    );
    expect(new RectangleBuilder(1, 2, 11, 12).intersectsPoint(12, 12)).to.eql(
      false,
    );

    expect(new RectangleBuilder(1, 2, 11, 12).intersectsPoint(5, 1)).to.eql(
      false,
    );
    expect(new RectangleBuilder(1, 2, 11, 12).intersectsPoint(5, 13)).to.eql(
      false,
    );
  });

  it("builds null when the builder is empty", () => {
    const builder = new RectangleBuilder();
    expect(builder.build()).to.equal(null);
  });
};
