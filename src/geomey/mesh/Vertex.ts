import { validateCoordinates } from "../coordinate";
import { Tolerance } from "../Tolerance";

/**
 * Class representing a vertex within a mesh. Meshes and vertices are normalized to a particular tolerance.
 * (e.g: if the tolerance is 0.1 and coordinates x=1.1, y=1.21 are supplied, then the vertex will be 1.1 1.2)
 */
export class Vertex {
  readonly x: number;
  readonly y: number;
  readonly key: string;
  readonly links: ReadonlyArray<Vertex>;

  constructor(x: number, y: number, tolerance: Tolerance, key: string = null) {
    validateCoordinates(x, y);
    x = tolerance.normalize(x);
    y = tolerance.normalize(y);
    this.x = x;
    this.y = y;
    this.key = key || calculateKey(x, y, tolerance.tolerance);
    this.links = [];
  }
}

export function calculateKey(x: number, y: number, tolerance: number): string {
  return `${Math.round(x / tolerance)}:${Math.round(y / tolerance)}`;
}
