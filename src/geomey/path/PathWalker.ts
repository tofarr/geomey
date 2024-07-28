/**
 * Interface representing a control point - compatible with CanvasRenderingContext2D
 */
export interface PathWalker {
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  bezierCurveTo(
    controlPoint1x: number,
    controlPoint1y: number,
    controlPoint2x: number,
    controlPoint2y: number,
    x: number,
    y: number,
  ): void;
  closePath(): void;
}
