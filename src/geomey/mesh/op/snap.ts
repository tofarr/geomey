import { comparePointsForSort, coordinateMatch } from "../../coordinate";
import { Tolerance } from "../../Tolerance";
import { Mesh } from "../Mesh";
import { Vertex } from "../Vertex";

export function snap(mesh: Mesh, tolerance: Tolerance) {
  const vertices = mesh.getVertices();
  vertices.sort((a, b) => {
    return comparePointsForSort(a.x, a.y, b.x, b.y);
  });
  const { length } = vertices;
  let startIndex = 0;
  while (startIndex < length) {
    const endIndex = getSnapEndIndex(vertices, startIndex, tolerance);
    snapVertices(vertices, startIndex, endIndex, mesh);
    startIndex = endIndex;
  }
}

export function getSnapEndIndex(
  vertices: Vertex[],
  startIndex: number,
  snapTolerance: Tolerance,
): number {
  const { length } = vertices;
  const { x: ax, y: ay } = vertices[startIndex];
  let endIndex = startIndex;
  while (++endIndex < length) {
    const { x: bx, y: by } = vertices[endIndex];
    if (!coordinateMatch(ax, ay, bx, by, snapTolerance)) {
      return endIndex;
    }
  }
  return endIndex;
}

export function snapVertices(
  vertices: Vertex[],
  startIndex: number,
  endIndex: number,
  mesh: Mesh,
) {
  if (startIndex + 1 >= endIndex) {
    return;
  }
  const vertex = createSnapVertex(vertices, startIndex, endIndex, mesh);
  while (startIndex < endIndex) {
    snapVertex(vertices[startIndex++], vertex, mesh);
  }
}

export function createSnapVertex(
  vertices: Vertex[],
  startIndex: number,
  endIndex: number,
  mesh: Mesh,
): Vertex {
  const length = endIndex - startIndex;
  let x = 0;
  let y = 0;
  while (startIndex < endIndex) {
    const vertex = vertices[startIndex++];
    x += vertex.x;
    y += vertex.y;
  }
  return mesh.addPoint(x / length, y / length);
}

export function snapVertex(vertex: Vertex, toVertex: Vertex, mesh: Mesh) {
  if (vertex.key == toVertex.key) {
    return;
  }
  for (const link of vertex.links) {
    mesh.addLink(link.x, link.y, toVertex.x, toVertex.y);
  }
  mesh.removePoint(vertex.x, vertex.y);
}
