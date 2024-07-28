import { forEachCoordinate, isNaNOrInfinite } from "../coordinate";
import { Transformer } from "./Transformer";

const NO_OP = 0;
const TRANSLATE = 1;
const SCALE = 2;
const SHEAR = 4;

/**
 * Class representing an affine transfomrm. Different to the java affine
 * transform in that transforms are always applied in forward order, and
 * provides a fluent interface.
 *
 * @author tofar
 */
export class AffineTransformer implements Transformer {
  private static identity: AffineTransformer;
  readonly scaleX: number;
  readonly shearX: number;
  readonly shearY: number;
  readonly scaleY: number;
  readonly translateX: number;
  readonly translateY: number;
  readonly mode: number;

  private constructor(
    scaleX: number,
    shearX: number,
    shearY: number,
    scaleY: number,
    translateX: number,
    translateY: number,
    mode: number,
  ) {
    this.scaleX = scaleX;
    this.shearX = shearX;
    this.shearY = shearY;
    this.scaleY = scaleY;
    this.translateX = translateX;
    this.translateY = translateY;
    this.mode = mode;
  }
  static getIdentity(): AffineTransformer {
    let { identity } = AffineTransformer;
    if (!identity) {
      AffineTransformer.identity = identity = new AffineTransformer(
        1,
        0,
        0,
        1,
        0,
        0,
        NO_OP,
      );
    }
    return identity;
  }
  static valueOf(
    scaleX: number,
    shearX: number,
    shearY: number,
    scaleY: number,
    translateX: number,
    translateY: number,
  ): AffineTransformer {
    if (
      isNaNOrInfinite(scaleX, shearX, translateX, shearY, scaleY, translateY)
    ) {
      throw new Error(
        `Invalid transform (${scaleX}, ${shearX}, ${translateX}, ${shearY}, ${scaleY}, ${translateY})`,
      );
    }
    const mode = calculateMode(
      scaleX,
      shearX,
      shearY,
      scaleY,
      translateX,
      translateY,
    );
    return mode == NO_OP
      ? this.getIdentity()
      : new AffineTransformer(
          scaleX,
          shearX,
          shearY,
          scaleY,
          translateX,
          translateY,
          mode,
        );
  }
  getInverse(): AffineTransformer {
    const { scaleX, scaleY, shearX, shearY, translateX, translateY, mode } =
      this;
    const det = scaleX * scaleY - shearX * shearY;
    return new AffineTransformer(
      scaleY / det,
      -shearX / det,
      -shearY / det,
      scaleX / det,
      (shearX * translateY - scaleY * translateX) / det,
      (shearY * translateX - scaleX * translateY) / det,
      mode,
    );
  }
  transform(x: number, y: number): [number, number] {
    return this.transformAll([x, y]) as [number, number]
  }
  transformAll(coordinates: ReadonlyArray<number>): ReadonlyArray<number> {
    const { scaleX, scaleY, shearX, shearY, translateX, translateY, mode } =
      this;
    if (mode === NO_OP) {
      return coordinates.slice();
    }
    const result = [];
    forEachCoordinate(coordinates, (x, y) => {
      switch (mode) {
        case SCALE | SHEAR:
          result.push(scaleX * x + shearX * y, shearY * x + scaleY * y);
          break;
        case SCALE | TRANSLATE:
          result.push(scaleX * x + translateX, scaleY * y + translateY);
          return;
        case SCALE:
          result.push(scaleX * x, scaleY * y);
          return;
        case SHEAR | TRANSLATE:
          result.push(x + shearX * y + translateX, y + shearY * x + translateY);
          return;
        case SHEAR:
          result.push(x + shearX * y, y + shearY * x);
          return;
        case TRANSLATE:
          result.push(x + translateX, y + translateY);
          return;
        default: // apply all
          result.push(
            scaleX * x + shearX * y + translateX,
            shearY * x + scaleY * y + translateY,
          );
      }
    });
  }
  toArray(): number[] {
    const { scaleX, scaleY, shearX, shearY, translateX, translateY } = this;
    return [scaleX, shearX, shearY, scaleY, translateX, translateY];
  }

  add(
    nScaleX: number,
    nShearX: number,
    nShearY: number,
    nScaleY: number,
    nTranslateX: number,
    nTranslateY: number,
  ): AffineTransformer {
    const { scaleX, shearX, shearY, scaleY, translateX, translateY } = this;
    return AffineTransformer.valueOf(
      nScaleX * scaleX + nShearX * shearY,
      nShearX * shearX + nShearX * scaleY,
      nShearY * scaleX + scaleY * shearY,
      nScaleY * shearX + scaleY * scaleY,
      nTranslateX * translateX + nShearX * translateY + translateX,
      nTranslateY * translateX + scaleY * translateY + translateY,
    );
  }
  scale(scaleX: number, scaleY?: number): AffineTransformer {
    if (scaleY == null) {
      scaleY = scaleX;
    }
    if (isNaNOrInfinite(scaleX, scaleY) || !scaleX || !scaleY) {
      throw new Error(`Invalid transform (${scaleX}, ${scaleY})`);
    }
    return this.add(scaleX, 0, 0, scaleY, 0, 0);
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
    result = result.add(cos, -sin, sin, cos, 0, 0);
    if (originX || originY) {
      result = result.translate(originX, originY);
    }
    return result
  }
  translate(x: number, y: number): AffineTransformer {
    return this.add(1, 0, 0, 1, x || 0, y || 0);
  }
}

function calculateMode(
  scaleX: number,
  shearX: number,
  shearY: number,
  scaleY: number,
  translateX: number,
  translateY: number,
): number {
  let ret = NO_OP;
  if (translateX != 0 || translateY != 0) {
    ret |= TRANSLATE;
  }
  if (!(scaleX == 1 && scaleY == 1)) {
    ret |= SCALE;
  }
  if (shearX != 0 || shearY != 0) {
    ret |= SHEAR;
  }
  return ret;
}
