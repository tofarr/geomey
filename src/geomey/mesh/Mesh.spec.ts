import * as chai from "chai";
import { Tolerance } from "../Tolerance";
import { Mesh } from "./Mesh";
import { Link } from "./Link";
import { LineString, MultiLineString } from "../geom";

const expect = chai.expect;

export const meshSpec = () => {
  it("adds vertices successfully", () => {
    const mesh = new Mesh(new Tolerance(0.05));
    const vertex = mesh.addVertex(3.01, 3.99);
    expect(vertex.x).to.eql(3);
    expect(vertex.y).to.eql(4);
    const vertex2 = mesh.addVertex(2.99, 4.01);
    expect(vertex2).to.equal(vertex);
  });
  it("creates links successfully between existing vertices", () => {
    const mesh = new Mesh(new Tolerance(0.05));
    const a = mesh.addVertex(10, 20);
    const b = mesh.addVertex(30, 40);
    expect(mesh.addLink(10.01, 20.01, 30.01, 40.01)).to.equal(1);
    expect(a.links).to.eql([b]);
    expect(b.links).to.eql([a]);
    const links = mesh.getLinks();
    expect(links.length).to.equal(1);
    expect(links[0].a).to.equal(a);
    expect(links[0].b).to.equal(b);
  });
  it("creates links successfully between new vertices", () => {
    const mesh = new Mesh(new Tolerance(0.05));
    expect(mesh.addLink(10.01, 20.01, 30.01, 40.01)).to.equal(1);
    const links = mesh.getLinks();
    expect(links.length).to.equal(1);
    expectLink(links[0], 10, 20, 30, 40);
  });
  it("creates an explicit point of intersection when a line crosses another", () => {
    const mesh = new Mesh(new Tolerance(0.05));
    expect(mesh.addLink(0, 0, 30, 30)).to.equal(1);
    expect(mesh.addLink(30, 0, 0, 30)).to.equal(2);
    const links = mesh.getLinks();
    expect(links.length).to.equal(4);
    expectLink(links[0], 0, 0, 15, 15);
    expectLink(links[1], 0, 30, 15, 15);
    expectLink(links[2], 15, 15, 30, 0);
    expectLink(links[3], 15, 15, 30, 30);
  });
  it("creates an multiple explicit points of intersection when a line crosses others", () => {
    const mesh = new Mesh(new Tolerance(0.05));
    expect(mesh.addLink(10, 0, 0, 10)).to.equal(1);
    expect(mesh.addLink(20, 0, 0, 20)).to.equal(1);
    expect(mesh.addLink(0, 0, 30, 30)).to.equal(3);
    const links = mesh.getLinks();
    expect(links.length).to.equal(7);
    expectLink(links[0], 0, 0, 5, 5);
    expectLink(links[1], 0, 10, 5, 5);
    expectLink(links[2], 0, 20, 10, 10);
    expectLink(links[3], 5, 5, 10, 0);
    expectLink(links[4], 5, 5, 10, 10);
    expectLink(links[5], 10, 10, 20, 0);
    expectLink(links[6], 10, 10, 30, 30);
  });
  it("clones deeply", () => {
    const mesh = new Mesh(new Tolerance(0.05));
    mesh.addLink(0, 0, 30, 30);
    mesh.addLink(30, 0, 0, 30);
    const otherMesh = mesh.clone();
    expect(mesh.getVertex(15, 15)).not.to.equal(otherMesh.getVertex(15, 15));
    mesh.removeVertex(0, 0);
    expect(mesh.getVertex(0, 0)).to.be.undefined;
    expect(otherMesh.getVertex(15, 15).links.length).to.equal(4);
  });
  it("getCoordinates gets all vertices", () => {
    const mesh = new Mesh(new Tolerance(0.05));
    mesh.addLink(0, 0, 30, 30);
    mesh.addLink(30, 0, 0, 30);
    mesh.addLink(30, 30, 40, 30);
    mesh.addLink(40, 30, 30, 0);
    const coordinates = mesh.getCoordinates();
    expect(coordinates).to.eql([0, 0, 0, 30, 15, 15, 30, 0, 30, 30, 40, 30]);
    const vertices = mesh.getVertices();
    expect(vertices).to.eql([
      mesh.getVertex(0, 0),
      mesh.getVertex(0, 30),
      mesh.getVertex(15, 15),
      mesh.getVertex(30, 0),
      mesh.getVertex(30, 30),
      mesh.getVertex(40, 30),
    ]);
  });
  it("getLinkCoordinates gets all links", () => {
    const mesh = new Mesh(new Tolerance(0.05));
    mesh.addLink(0, 0, 30, 30);
    mesh.addLink(30, 0, 0, 30);
    mesh.addLink(30, 30, 45, 15);
    mesh.addLink(45, 15, 30, 0);
    const links = mesh.getLinkCoordinates();
    expect(links).to.eql([
      [0, 0, 15, 15],
      [0, 30, 15, 15],
      [15, 15, 30, 0],
      [15, 15, 30, 30],
      [30, 0, 45, 15],
      [30, 30, 45, 15],
    ]);
  });
  it("getLineStrings gets all lineString", () => {
    const mesh = new Mesh(new Tolerance(0.05));
    mesh.addLink(0, 0, 30, 30);
    mesh.addLink(30, 0, 0, 30);
    mesh.addLink(30, 30, 45, 15);
    mesh.addLink(45, 15, 30, 0);
    mesh.addLink(50, 0, 60, 0);
    mesh.addLink(60, 10, 60, 0);
    mesh.addLink(50, 10, 60, 10);
    mesh.addLink(70, 0, 80, 0);
    mesh.addLink(80, 0, 80, 10);
    mesh.addLink(70, 10, 80, 10);
    mesh.addLink(70, 0, 70, 10);
    const lineStrings = mesh
      .getLineStrings()
      .map((coordinates) => new LineString(coordinates));
    const multiLineString = new MultiLineString(lineStrings);
    expect(multiLineString.toWkt()).to.equal(
      "MULTILINESTRING((0 0, 15 15),(0 30, 15 15),(15 15, 30 0, 45 15, 30 30, 15 15),(50 0, 60 0, 60 10, 50 10),(70 0, 80 0, 80 10, 70 10, 70 0))",
    );
  });
  it("getLinearRings gets all linearRings", () => {
    const mesh = new Mesh(new Tolerance(0.05));
    mesh.addLink(0, 0, 30, 30);
    mesh.addLink(30, 0, 0, 30);
    mesh.addLink(30, 30, 45, 15);
    mesh.addLink(45, 15, 30, 0);
    mesh.addLink(50, 0, 60, 0);
    mesh.addLink(60, 10, 60, 0);
    mesh.addLink(50, 10, 60, 10);
    mesh.addLink(70, 0, 80, 0);
    mesh.addLink(80, 0, 80, 10);
    mesh.addLink(70, 10, 80, 10);
    mesh.addLink(70, 0, 70, 10);
    const linearRings = mesh.getLinearRings();
    expect(linearRings).to.eql([
      [15, 15, 30, 0, 45, 15, 30, 30],
      [70, 0, 80, 0, 80, 10, 70, 10],
    ]);
  });
  it("cullLinks removes links", () => {
    const mesh = new Mesh(new Tolerance(0.05));
    mesh.addLink(0, 0, 30, 30);
    mesh.addLink(30, 0, 0, 30);
    mesh.addLink(30, 0, 30, 30);
    mesh.cullLinks(() => true);
    expect(mesh.getVertices().length).to.eql(5);
    expect(mesh.getLinkCoordinates()).to.eql([]);
  });
  it("cullVertices removes vertices and attached links", () => {
    const mesh = new Mesh(new Tolerance(0.05));
    mesh.addLink(0, 0, 30, 30);
    mesh.addLink(30, 0, 0, 30);
    mesh.addLink(30, 0, 30, 30);
    mesh.cullVertices((x, y) => x == 15 && y == 15);
    expect(mesh.getVertices().length).to.eql(4);
    expect(mesh.getLinkCoordinates()).to.eql([[30, 0, 30, 30]]);
  });
  it("handles overlapping colinear segments correctly", () => {
    const mesh = new Mesh(new Tolerance(0.05));
    mesh.addLink(0, 2, 6, 8);
    mesh.addLink(4, 6, 8, 10);
    expect(mesh.getLineStrings()).to.eql([[0, 2, 4, 6, 6, 8, 8, 10]]);
  });
  it("handles contained colinear segments correctly", () => {
    const mesh = new Mesh(new Tolerance(0.05));
    mesh.addLink(0, 0, 30, 30);
    mesh.addLink(10, 10, 20, 20);
    expect(mesh.getLineStrings()).to.eql([[0, 0, 10, 10, 20, 20, 30, 30]]);
  });
};

function expectLink(
  link: Link,
  ax: number,
  ay: number,
  bx: number,
  by: number,
) {
  expect([link.a.x, link.a.y, link.b.x, link.b.y]).to.eql([ax, ay, bx, by]);
}
