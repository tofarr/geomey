import * as chai from "chai";
import { Tolerance } from "../Tolerance";
import { Mesh } from "./Mesh";
import { Link } from "./Link";
import { LineString, MultiLineString, Rectangle } from "../geom";
import { MeshError } from "./MeshError";
import { MeshPathWalker } from "./MeshPathWalker";

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
  it("getLineStrings gets all lineStrings", () => {
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
  it("adds a vertex", () => {
    const mesh = new Mesh(new Tolerance(0.05));
    mesh.addLink(0, 0, 1, 1);
    mesh.addLink(1, 0, 1, 1);
    mesh.addLink(1, 1, 2, 1);
    expect(mesh.getLineStrings()).to.eql([
      [0, 0, 1, 1],
      [1, 0, 1, 1],
      [1, 1, 2, 1],
    ]);
  });
  it("does not allow links with NaN or Infinite vertices", () => {
    const mesh = new Mesh(new Tolerance(0.05));
    expect(() => {
      mesh.addLink(Infinity, 0, 1, 1);
    }).to.throw(MeshError);
    expect(() => {
      mesh.addLink(0, NaN, 1, 1);
    }).to.throw(MeshError);
    expect(() => {
      mesh.addLink(0, 0, NaN, 1);
    }).to.throw(MeshError);
    expect(() => {
      mesh.addLink(0, 0, 1, Infinity);
    }).to.throw(MeshError);
  });
  it("does not allow links with NaN or Infinite vertices when getting intersections", () => {
    const mesh = new Mesh(new Tolerance(0.05));
    expect(() => {
      mesh.getIntersections(Infinity, 0, 1, 1);
    }).to.throw(MeshError);
    expect(() => {
      mesh.getIntersections(0, NaN, 1, 1);
    }).to.throw(MeshError);
    expect(() => {
      mesh.getIntersections(0, 0, NaN, 1);
    }).to.throw(MeshError);
    expect(() => {
      mesh.getIntersections(0, 0, 1, Infinity);
    }).to.throw(MeshError);
  });
  it("does not allow links to self", () => {
    const mesh = new Mesh(new Tolerance(0.05));
    expect(mesh.getIntersections(1, 2, 1, 2)).to.eql([]);
  });
  it("remove vertex does not allow NaN or Infinite coordinates", () => {
    const mesh = new Mesh(new Tolerance(0.05));
    mesh.addLink(0, 1, 2, 3);
    expect(mesh.removeVertex(1, Infinity)).to.equal(false);
    expect(mesh.removeVertex(NaN, 1)).to.equal(false);
  });
  it("remove vertex returns false if the vertex doesn't exist", () => {
    const mesh = new Mesh(new Tolerance(0.05));
    mesh.addLink(0, 1, 2, 3);
    expect(mesh.removeVertex(4, 5)).to.equal(false);
  });
  it("remove link to self returns false", () => {
    const mesh = new Mesh(new Tolerance(0.05));
    mesh.addLink(0, 1, 2, 3);
    expect(mesh.removeLink(0, 1, 0, 1)).to.equal(false);
    expect(mesh.removeLink(2, 2, 2, 3)).to.equal(false);
    expect(mesh.removeLink(0, 1, 2, 4)).to.equal(false);
    expect(mesh.getLinks().length).to.equal(1);
  });
  it("iterates over vertices within a rectangle", () => {
    const mesh = new Mesh(new Tolerance(0.05));
    for (let x = 0; x < 7; x++) {
      for (let y = 0; y < 7; y++) {
        mesh.addLink(x, y, x + 1, y + 1);
      }
    }
    const results = [];
    mesh.forEachVertex(
      ({ x, y }) => {
        results.push(`${x}:${y}`);
      },
      new Rectangle(2, 2, 4, 4),
    );
    results.sort();
    expect(results).to.eql([
      "2:2",
      "2:3",
      "2:4",
      "3:2",
      "3:3",
      "3:4",
      "4:2",
      "4:3",
      "4:4",
    ]);
  });
  it("stops iteration", () => {
    const mesh = new Mesh(new Tolerance(0.05));
    for (let x = 0; x < 7; x++) {
      for (let y = 0; y < 7; y++) {
        mesh.addLink(x, y, x + 1, y + 1);
      }
    }
    const results = [];
    expect(
      mesh.forEachVertex(({ x }) => {
        results.push(x);
        return x < 2;
      }),
    ).to.equal(false);
    results.sort();
    expect(results[results.length - 1]).to.be.above(0);
    for (const x of results.slice(0, results.length - 1)) {
      expect(x).to.be.below(2);
    }
  });
  it("stops iteration within bounding box", () => {
    const mesh = new Mesh(new Tolerance(0.05));
    for (let x = 0; x < 7; x++) {
      for (let y = 0; y < 7; y++) {
        mesh.addLink(x, y, x + 1, y + 1);
      }
    }
    const results = [];
    expect(
      mesh.forEachVertex(
        ({ x }) => {
          results.push(x);
          return x < 2;
        },
        new Rectangle(1, 1, 4, 4),
      ),
    ).to.equal(false);
    results.sort();
    expect(results[results.length - 1]).to.be.above(1);
    for (const x of results.slice(0, results.length - 1)) {
      expect(x).to.be.above(0);
      expect(x).to.be.below(2);
    }
  });
  it("iterates over links within a rectangle", () => {
    const mesh = new Mesh(new Tolerance(0.05));
    for (let x = 0; x < 7; x++) {
      for (let y = 0; y < 7; y++) {
        mesh.addLink(x, y, x + 1, y + 1);
      }
    }
    const results = [];
    expect(
      mesh.forEachLink(
        ({ a, b }) => {
          results.push(`${a.x}:${a.y}:${b.x}:${b.y}`);
        },
        new Rectangle(3, 3, 4, 4),
      ),
    ).to.equal(true);
    results.sort();
    expect(results).to.eql([
      "2:2:3:3",
      "2:3:3:4",
      "2:4:3:5",
      "3:2:4:3",
      "3:3:4:4",
      "3:4:4:5",
      "4:2:5:3",
      "4:3:5:4",
      "4:4:5:5",
    ]);
  });

  it("stops iteration over centroids", () => {
    const mesh = new Mesh(new Tolerance(0.05));
    for (let x = 0; x < 7; x++) {
      for (let y = 0; y < 7; y++) {
        mesh.addLink(x, y, x + 1, y + 1);
      }
    }
    const results = [];
    expect(
      mesh.forEachVertexAndLinkCentroid((x) => {
        results.push(x);
        return false;
      }),
    ).to.equal(false);
    expect(results.length).to.equal(1);
  });

  it("stops iteration over line strings", () => {
    const mesh = new Mesh(new Tolerance(0.05));
    mesh.addLink(4, 0, 4, 4);
    mesh.addLink(4, 4, 6, 4);
    mesh.addLink(6, 4, 6, 0);
    mesh.addLink(5, 0, 5, 5);
    mesh.addLink(5, 5, 8, 5);
    const results = [];
    expect(
      mesh.forEachLineString((ls) => {
        results.push(ls);
        return false;
      }),
    ).to.equal(false);
    expect(results.length).to.equal(1);
  });

  it("stops iteration over line strings for rings", () => {
    const walker = MeshPathWalker.valueOf(new Tolerance(0.05));
    new LineString([0, 0, 10, 0, 10, 10, 0, 10, 0, 0]).walkPath(walker);
    new LineString([20, 0, 30, 0, 30, 10, 20, 10, 20, 0]).walkPath(walker);
    const meshes = walker.getMeshes();
    const results = [];
    expect(
      meshes[1].forEachLineString((ls) => {
        results.push(ls);
        return false;
      }),
    ).to.equal(false);
    expect(results.length).to.equal(1);
  });

  it("sorts linestrings", () => {
    const mesh = new Mesh(new Tolerance(0.05));
    for (let n = 0; n < 5; n++) {
      mesh.addLink(n, 0, 2, 2);
      mesh.addLink(n, 4, 2, 2);
      mesh.addLink(0, n, 2, 2);
      mesh.addLink(4, n, 2, 2);
    }
    const result = mesh.getLineStrings();
    expect(result).to.eql([
      [0, 0, 2, 2],
      [0, 1, 2, 2],
      [0, 2, 2, 2],
      [0, 3, 2, 2],
      [0, 4, 2, 2],
      [1, 0, 2, 2],
      [1, 4, 2, 2],
      [2, 0, 2, 2],
      [2, 2, 2, 4],
      [2, 2, 3, 0],
      [2, 2, 3, 4],
      [2, 2, 4, 0],
      [2, 2, 4, 1],
      [2, 2, 4, 2],
      [2, 2, 4, 3],
      [2, 2, 4, 4],
    ]);
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
