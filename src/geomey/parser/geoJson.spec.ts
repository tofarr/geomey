import * as chai from "chai";
import { Tolerance } from "../Tolerance";
import { GeoJsonParser, parseGeoJson } from "./GeoJsonParser";
import {
  GeoJsonGeometryCollection,
  GeoJsonLineString,
  GeoJsonMultiLineString,
  GeoJsonMultiPoint,
  GeoJsonMultiPolygon,
  GeoJsonPoint,
  GeoJsonPolygon,
} from "../geoJson";

const expect = chai.expect;

export const geoJsonSpec = () => {
  it("parses and renders a point", () => {
    const geoJson = { type: "Point", coordinates: [12, 34] };
    const parsed = parseGeoJson(geoJson as GeoJsonPoint);
    const rendered = parsed.toGeoJson();
    expect(rendered).to.eql(geoJson);
  });

  it("parses and renders a multipoint", () => {
    const geoJson = { type: "MultiPoint", coordinates: [[12, 34]] };
    const parsed = new GeoJsonParser().parse(geoJson as GeoJsonMultiPoint);
    const rendered = parsed.toGeoJson();
    expect(rendered).to.eql(geoJson);
  });

  it("parses and renders an unsanitized linestring", () => {
    const geoJson = {
      type: "LineString",
      coordinates: [
        [0, 0],
        [100, 0],
        [100, 100],
        [0, 100],
      ],
    };
    const parsed = parseGeoJson(geoJson as GeoJsonLineString);
    const rendered = parsed.toGeoJson();
    expect(rendered).to.eql(geoJson);
  });

  it("parses and renders an unsanitized self intersecting linestring", () => {
    const geoJson = {
      type: "LineString",
      coordinates: [
        [0, 50],
        [100, 50],
        [100, 100],
        [50, 100],
        [50, 0],
      ],
    };
    const parsed = parseGeoJson(geoJson as GeoJsonLineString);
    const rendered = parsed.toGeoJson();
    expect(rendered).to.eql(geoJson);
  });

  it("parses and renders a sanitized self intersecting linestring", () => {
    const geoJson = {
      type: "LineString",
      coordinates: [
        [0, 50],
        [100, 50],
        [100, 100],
        [50, 100],
        [50, 0],
      ],
    };
    const parsed = parseGeoJson(
      geoJson as GeoJsonLineString,
      new Tolerance(0.05),
    );
    const rendered = parsed.toGeoJson();
    expect(rendered).to.eql({
      type: "MultiLineString",
      coordinates: [
        [
          [0, 50],
          [50, 50],
        ],
        [
          [50, 0],
          [50, 50],
        ],
        [
          [50, 50],
          [50, 100],
          [100, 100],
          [100, 50],
          [50, 50],
        ],
      ],
    });
  });

  it("parses and renders a sanitized self intersecting multilinestring", () => {
    const geoJson = {
      type: "MultiLineString",
      coordinates: [
        [
          [0, 50],
          [50, 50],
        ],
        [
          [50, 0],
          [50, 50],
        ],
        [
          [50, 50],
          [50, 100],
          [100, 100],
          [100, 50],
          [50, 50],
        ],
      ],
    };
    const parsed = parseGeoJson(
      geoJson as GeoJsonMultiLineString,
      new Tolerance(0.05),
    );
    const rendered = parsed.toGeoJson();
    expect(rendered).to.eql(geoJson);
  });

  it("parses and renders an unsanitized polygon", () => {
    const geoJson = {
      type: "Polygon",
      coordinates: [
        [
          [0, 0],
          [100, 0],
          [100, 100],
          [0, 100],
          [0, 0],
        ],
      ],
    };
    const parsed = parseGeoJson(geoJson as GeoJsonPolygon, new Tolerance(0.05));
    const rendered = parsed.toGeoJson();
    expect(rendered).to.eql(geoJson);
  });

  it("parses and renders a sanitized self intersecting polygon", () => {
    // Self intersecting polygon is broken into 2 polygons
    const geoJson = {
      type: "Polygon",
      coordinates: [
        [
          [0, 0],
          [100, 0],
          [0, 100],
          [100, 100],
          [0, 0],
        ],
      ],
    };
    const parsed = parseGeoJson(geoJson as GeoJsonPolygon, new Tolerance(0.05));
    const rendered = parsed.toGeoJson();
    const expected = {
      type: "MultiPolygon",
      coordinates: [
        [
          [
            [0, 0],
            [100, 0],
            [50, 50],
            [0, 0],
          ],
        ],
        [
          [
            [0, 100],
            [50, 50],
            [100, 100],
            [0, 100],
          ],
        ],
      ],
    };
    expect(rendered).to.eql(expected);
  });

  it("parses and renders a sanitized self intersecting polygon", () => {
    // Self intersecting polygon is broken into 3 polygons
    const geoJson = {
      type: "Polygon",
      coordinates: [
        [
          [0, 0],
          [200, 0],
          [100, 100],
          [0, 0],
        ],
        [
          [100, 0],
          [50, 50],
          [150, 50],
          [100, 0],
        ],
      ],
    };
    const parsed = parseGeoJson(geoJson as GeoJsonPolygon, new Tolerance(0.05));
    const rendered = parsed.toGeoJson();
    const expected = {
      type: "MultiPolygon",
      coordinates: [
        [
          [
            [0, 0],
            [100, 0],
            [50, 50],
            [0, 0],
          ],
        ],
        [
          [
            [50, 50],
            [150, 50],
            [100, 100],
            [50, 50],
          ],
        ],
        [
          [
            [100, 0],
            [200, 0],
            [150, 50],
            [100, 0],
          ],
        ],
      ],
    };
    expect(rendered).to.eql(expected);
  });

  it("parses and renders an unsanitized multipolygon", () => {
    const geoJson = {
      type: "MultiPolygon",
      coordinates: [
        [
          [
            [0, 0],
            [100, 0],
            [100, 100],
            [0, 100],
            [0, 0],
          ],
        ],
      ],
    };
    const parsed = parseGeoJson(geoJson as GeoJsonMultiPolygon);
    const rendered = parsed.toGeoJson();
    expect(rendered).to.eql(geoJson);
  });

  it("parses and renders a geometry collection", () => {
    const geoJson = {
      type: "GeometryCollection",
      geometries: [
        {
          type: "Polygon",
          coordinates: [
            [
              [0, 0],
              [100, 0],
              [0, 100],
              [0, 0],
            ],
          ],
        },
        { type: "Point", coordinates: [100, 100] },
        {
          type: "LineString",
          coordinates: [
            [200, 0],
            [200, 100],
            [300, 100],
          ],
        },
      ],
    };
    const parsed = parseGeoJson(
      geoJson as GeoJsonGeometryCollection,
      new Tolerance(0.05),
    );
    const rendered = parsed.toGeoJson();
    const expected = {
      type: "GeometryCollection",
      geometries: [
        {
          type: "Polygon",
          coordinates: [
            [
              [0, 0],
              [100, 0],
              [0, 100],
              [0, 0],
            ],
          ],
        },
        {
          type: "LineString",
          coordinates: [
            [200, 0],
            [200, 100],
            [300, 100],
          ],
        },
        { type: "Point", coordinates: [100, 100] },
      ],
    };
    expect(rendered).to.eql(expected);
  });

  it("parses and renders an unsanitized multipoint", () => {
    const geoJson = {
      type: "MultiPoint",
      coordinates: [
        [0, 0],
        [0, 100],
        [100, 0],
        [100, 100],
      ],
    };
    const parsed = parseGeoJson(
      geoJson as GeoJsonMultiPoint,
      new Tolerance(0.05),
    );
    const rendered = parsed.toGeoJson();
    expect(rendered).to.eql(geoJson);
  });

  it("parses and renders a geometry collection with multi components", () => {
    const geoJson = {
      type: "GeometryCollection",
      geometries: [
        {
          type: "MultiPolygon",
          coordinates: [
            [
              [
                [0, 0],
                [100, 0],
                [0, 100],
                [0, 0],
              ],
            ],
          ],
        },
        {
          type: "MultiLineString",
          coordinates: [
            [
              [200, 0],
              [200, 100],
              [300, 100],
            ],
          ],
        },
        { type: "MultiPoint", coordinates: [101, 0, 101, 100] },
      ],
    };
    const parsed = parseGeoJson(
      geoJson as GeoJsonGeometryCollection,
      new Tolerance(0.05),
    );
    const rendered = parsed.toGeoJson();
    const expected = {
      type: "GeometryCollection",
      geometries: [
        {
          type: "Polygon",
          coordinates: [
            [
              [0, 0],
              [100, 0],
              [0, 100],
              [0, 0],
            ],
          ],
        },
        {
          type: "LineString",
          coordinates: [
            [200, 0],
            [200, 100],
            [300, 100],
          ],
        },
        {
          type: "Point",
          coordinates: [101, 0],
        },
        {
          type: "Point",
          coordinates: [101, 100],
        },
      ],
    };
    expect(rendered).to.eql(expected);
  });

  it("throws an exception when a geometry collection has an unknown component", () => {
    const geoJson = {
      type: "GeometryCollection",
      geometries: [
        { type: "Unknown", coordinates: [100, 100] },
      ],
    };
    expect(() => {
      parseGeoJson(geoJson as GeoJsonGeometryCollection);
    }).to.throw(Error);
  });
};
