import * as chai from "chai";
import { Tolerance } from "../Tolerance";
import { Mesh } from "./Mesh";
import { MeshError } from "./MeshError";
import { Edge } from "./Edge";
import { Vertex } from "./Vertex";

const expect = chai.expect;

export const edgeSpec = () => {
  it("does not allow points to connect to themselves", () => {
    const vertex = new Vertex(2, 3, new Tolerance(0.1))
    expect(() => {
      new Edge(vertex, vertex)
    }).to.throw(MeshError)
  });
};
