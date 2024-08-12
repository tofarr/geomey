export class Vertex {
  readonly x: number;
  readonly y: number;
  readonly key: string;
  readonly links: ReadonlyArray<Vertex>;

  constructor(x: number, y: number, key: string, links?: Vertex[]) {
    this.x = x;
    this.y = y;
    this.key = key;
    this.links = links || [];
  }
}
