import { forEachCoordinate, isNaNOrInfinite } from "../coordinate";
import { Transformer } from "./Transformer";

const NO_OP = 0;
const TRANSLATE = 1;
const SCALE = 2;
const SHEAR = 4;

/**
 * Class representing an affine transfomrm.
 *
 * @author tofar
 */
export class AffineTransformer implements Transformer {
  static readonly IDENTITY = new AffineTransformer(1, 0, 0, 0, 1, 0);
  readonly m00: number
  readonly m10: number
  readonly m20: number
  readonly m01: number
  readonly m11: number
  readonly m21: number

  constructor(
    m00: number,
    m10: number,
    m20: number,
    m01: number,
    m11: number,
    m21: number,
  ) {
    if (
      isNaNOrInfinite(m00, m10, m20, m01, m11, m21)
    ) {
      throw new Error(
        `Invalid transform (${m00}, ${m10}, ${m20}, ${m01}, ${m11}, ${m21})`,
      );
    }
    this.m00 = m00;
    this.m10 = m10;
    this.m20 = m20;
    this.m01 = m01;
    this.m11 = m11;
    this.m21 = m21;
  }
  getInverse(): AffineTransformer {
    const { m00, m10, m20, m01, m11, m21 } = this
    const det = m00 * m11 - m10 * m01;
    return new AffineTransformer(
      m11 / det,
      -m01 / det,
      (m10 * m21 - m20 * m11) / det,
      -m10 / det,
      m00 / det,
      (-m00 * m21 + m01 * m20) / det,
    );
  }
  transform(x: number, y: number): [number, number] {
    return this.transformAll([x, y]) as [number, number];
  }
  transformAll(coordinates: ReadonlyArray<number>): ReadonlyArray<number> {
    const { m00, m10, m20, m01, m11, m21 } = this
      this;
    const result = [];
    forEachCoordinate(coordinates, (x, y) => {
      result.push(
        m00 * x + m10 * y + m20,
        m01 * x + m11 * y + m21,
      );
    });
    return result
  }
  add(
    n00: number,
    n10: number,
    n20: number,
    n01: number,
    n11: number,
    n21: number,
  ): AffineTransformer {
    const { m00, m10, m20, m01, m11, m21 } = this
    return new AffineTransformer(
      n00 * m00 + n10 * m01 + n20 * m20,
      n00 * m10 + n10 * m11,
      n00 * m20 + n10 * m21 + n20,
      n01 * m00 + n11 * m01 + n21 * m20,
      n01 * m10 + n11 * m11,
      n01 * m20 + n11 * m21 + n21,
    )
  }
  scale(scaleX: number, scaleY?: number): AffineTransformer {
    if (scaleY == null) {
      scaleY = scaleX;
    }
    if (isNaNOrInfinite(scaleX, scaleY) || !scaleX || !scaleY) {
      throw new Error(`Invalid transform (${scaleX}, ${scaleY})`);
    }
    return this.add(scaleX, 0, 0, 0, scaleY, 0);
  }
  scaleAround(
    scale: number,
    originX: number,
    originY: number,
  ): AffineTransformer {
    return this.translate(-originX, -originY)
      .scale(scale)
      .translate(originX, originY);
  }
  rotateDegrees(
    degrees: number,
    originX?: number,
    originY?: number,
  ): AffineTransformer {
    return this.rotateRadians((degrees * Math.PI) / 180, originX, originY);
  }
  rotateRadians(
    radians: number,
    originX?: number,
    originY?: number,
  ): AffineTransformer {
    let sin = Math.sin(radians);
    let cos;
    if (sin == 1) {
      // 90
      cos = 0;
    } else if (sin == -1) {
      // 270
      cos = 0;
    } else {
      cos = Math.cos(radians);
      if (cos == 1) {
        // 0
        return this;
      } else if (cos == -1) {
        // 180
        sin = 0;
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let result: AffineTransformer = this;
    if (originX || originY) {
      result = result.translate(-originX, -originY);
    }
    result = result.add(cos, -sin, 0, sin, cos, 0);
    if (originX || originY) {
      result = result.translate(originX, originY);
    }
    return result;
  }
  translate(x: number, y: number): AffineTransformer {
    return this.add(1, 0, x, 0, 1, y);
  }
}