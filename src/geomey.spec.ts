import { zOrderIndexSpec } from "./geomey/spatialIndex/ZOrderIndex.spec";
import { rTreeSpec } from "./geomey/spatialIndex/RTree.spec";
import { meshSpec } from "./geomey/mesh/Mesh.spec";
import { coordinateSpec } from "./geomey/coordinate.spec";
import { wktSpec } from "./geomey/parser/wkt.spec";
import { relateSpec } from "./geomey/geom/relate.spec";
import { toleranceSpec } from "./geomey/Tolerance.spec";
import { relationSpec } from "./geomey/Relation.spec";
import { linearRingSpec } from "./geomey/geom/LinearRing.spec";

describe("Coordinate", coordinateSpec);
describe("Tolerance", toleranceSpec);
describe("Relation", relationSpec);
describe("ZOrderIndex", zOrderIndexSpec);
describe("RTree", rTreeSpec);
describe("Mesh", meshSpec);
describe("Wkt", wktSpec);
describe("Relate", relateSpec);
describe("LinearRing", linearRingSpec);
