import { NUMBER_FORMATTER } from "../formatter";
import { PathWalker } from "./PathWalker";

export class SVGPathWalker implements PathWalker {
  private path: string[];
  private numberFormatter: (n: number) => string;
  private isLine: boolean;

  constructor(numberFormatter?: (n: number) => string) {
    this.path = [];
    this.numberFormatter = numberFormatter || NUMBER_FORMATTER;
    this.isLine = false;
  }

  moveTo(x: number, y: number): void {
    const { numberFormatter } = this;
    this.path.push("M", numberFormatter(x), " ", numberFormatter(y));
    this.isLine = false;
  }

  lineTo(x: number, y: number): void {
    const { numberFormatter } = this;
    this.path.push(
      this.isLine ? " " : "L",
      numberFormatter(x),
      " ",
      numberFormatter(y),
    );
    this.isLine = true;
  }

  bezierCurveTo(
    controlPoint1X: number,
    controlPoint1Y: number,
    controlPoint2X: number,
    controlPoint2Y: number,
    x: number,
    y: number,
  ): void {
    const { numberFormatter } = this;
    this.path.push(
      "C",
      numberFormatter(controlPoint1X),
      " ",
      numberFormatter(controlPoint1Y),
      ", ",
      numberFormatter(controlPoint2X),
      " ",
      numberFormatter(controlPoint2Y),
      ", ",
      numberFormatter(x),
      " ",
      numberFormatter(y),
    );
    this.isLine = false;
  }

  closePath(): void {
    this.path.push("Z");
    this.isLine = false;
  }

  toPath(): string {
    return this.path.join("");
  }
}
