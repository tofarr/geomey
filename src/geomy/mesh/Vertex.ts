const TWO_PI = 2 * Math.PI;

export class Vertex {
  readonly x: number;
  readonly y: number;
  readonly zOrder: bigint;
  readonly links: ReadonlyArray<Vertex>;

  constructor(
    x: number,
    y: number,
    zOrder: bigint,
    links?: Vertex[],
    ring?: boolean,
  ) {
    this.x = x;
    this.y = y;
    this.zOrder = zOrder;
    this.links = links || [];
  }
}
