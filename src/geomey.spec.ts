import { zOrderIndexSpec } from "./geomey/spatialIndex/ZOrderIndex.spec";
import { rTreeSpec } from "./geomey/spatialIndex/RTree.spec";
import { meshSpec } from "./geomey/mesh/Mesh.spec";
import { coordinateSpec } from "./geomey/coordinate.spec";
import { wktSpec } from "./geomey/parser/wkt.spec";

describe("Coordinate", coordinateSpec);
describe("ZOrderIndex", zOrderIndexSpec);
describe("RTree", rTreeSpec);
describe("Mesh", meshSpec);
describe("Wkt", wktSpec);
