import * as chai from "chai";
import {
  angle,
  appendChanged,
  compareCoordinatesForSort,
  coordinateEqual,
  coordinatesMatch,
  crossProduct,
  forEachCoordinate,
  isConvex,
} from "./coordinate";
import { Tolerance } from "./Tolerance";

const expect = chai.expect;
const TOLERANCE = new Tolerance(0.05);

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

  it("forEachCoordinate interates as expected", () => {
    const processed = [];
    const result = forEachCoordinate([...Array(10).keys()], (x, y) => {
      processed.push(x, y);
      return x != 4;
    });
    expect(result).to.equal(false);
    expect(processed).to.eql([0, 1, 2, 3, 4, 5]);
  });

  it("appendChanged adds only if there is a difference", () => {
    const coordinates = [];
    appendChanged(1, 2, TOLERANCE, coordinates);
    expect(coordinates).to.eql([1, 2]);
    appendChanged(1.01, 1.99, TOLERANCE, coordinates);
    expect(coordinates).to.eql([1, 2]);
    appendChanged(1.06, 1.99, TOLERANCE, coordinates);
    expect(coordinates).to.eql([1, 2, 1.06, 1.99]);
    appendChanged(1.05, 2.05, TOLERANCE, coordinates);
    expect(coordinates).to.eql([1, 2, 1.06, 1.99, 1.05, 2.05]);
  });

  it("coordinatesMath matches", () => {
    expect(coordinatesMatch([0, 1, 2, 3], [0, 1, 2, 3], TOLERANCE)).to.equal(
      true,
    );
    expect(
      coordinatesMatch([0, 1, 2, 3], [0.01, 1.01, 2.01, 3.01], TOLERANCE),
    ).to.equal(true);
    expect(
      coordinatesMatch([0, 1, 2, 3], [0, 1, 2, 3, 4, 5], TOLERANCE),
    ).to.equal(false);
    expect(coordinatesMatch([0, 1, 2, 3], [0, 1, 2.2, 3], TOLERANCE)).to.equal(
      false,
    );
  });

  it("calculates the cross product correctly", () => {
    expect(crossProduct(1, 0, 2, 1, 1, 2)).to.equal(2);
    expect(crossProduct(1, 0, 0, 1, 1, 2)).to.equal(-2);
  });

  it("calculates the convexness correctly", () => {
    expect(isConvex(1, 0, 2, 1, 1, 2)).to.equal(true);
    expect(isConvex(1, 0, 0, 1, 1, 2)).to.equal(false);
  });

  it("compares coordinates correctly", () => {
    expect(compareCoordinatesForSort([], [])).to.equal(0);
    expect(compareCoordinatesForSort([1, 2], [1, 2])).to.equal(0);

    expect(compareCoordinatesForSort([], [1, 2])).to.be.below(0);
    expect(compareCoordinatesForSort([1, 2], [1, 3])).to.be.below(0);
    expect(compareCoordinatesForSort([1, 2], [2, 2])).to.be.below(0);
    expect(compareCoordinatesForSort([1, 2], [1, 2, 1, 2])).to.be.below(0);

    expect(compareCoordinatesForSort([1, 2], [])).to.be.above(0);
    expect(compareCoordinatesForSort([1, 3], [1, 2])).to.be.above(0);
    expect(compareCoordinatesForSort([2, 2], [1, 2])).to.be.above(0);
    expect(compareCoordinatesForSort([1, 2, 1, 2], [1, 2])).to.be.above(0);
  });

  it("Coordinate equal works", () => {
    expect(coordinateEqual(2, 3, 2, 3)).to.equal(true);
    expect(coordinateEqual(2, 3, 2, 7)).to.equal(false);
    expect(coordinateEqual(2, 3, 5, 3)).to.equal(false);
    expect(coordinateEqual(2, 3, 5, 7)).to.equal(false);
  })
};
