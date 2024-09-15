import { comparePointsForSort } from "../coordinate";
import { Rectangle } from "../geom";
import { MeshError } from "./MeshError";
import { Vertex } from "./Vertex";

export class Edge {
  readonly a: Vertex;
  readonly b: Vertex;
  readonly rectangle: Rectangle;

  constructor(a: Vertex, b: Vertex) {
    const compare = comparePointsForSort(a.x, a.y, b.x, b.y);
    if (compare < 0) {
      this.a = a;
      this.b = b;
    } else if (compare > 0) {
      this.b = a;
      this.a = b;
    } else {
      throw new MeshError(`Invalid Edge: ${a.x} ${a.y} ${b.x} ${b.y}`);
    }
    this.rectangle = Rectangle.valueOf([a.x, a.y, b.x, b.y]);
  }
}
