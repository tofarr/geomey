import { isNaNOrInfinite } from "./coordinate";

/**
 *  A lot of spatial operations require a tolerance for inaccuracy. One reason for this is to
 * compensate for rounding errors. (For example, when determining of a point lies "on" a line)
 */
export class Tolerance {
  readonly tolerance: number;

  constructor(tolerance: number) {
    if (isNaNOrInfinite(tolerance) || tolerance <= 0) {
      throw new Error(`Invalid Tolerance: ${tolerance}`);
    }
    this.tolerance = tolerance;
  }

  within(value: number): boolean {
    return Math.abs(value) <= this.tolerance;
  }

  match(a: number, b: number): boolean {
    return Math.abs(a - b) <= this.tolerance;
  }

  normalize(value: number): number {
    const { tolerance } = this;
    return Math.round(value / tolerance) * tolerance;
  }
}
