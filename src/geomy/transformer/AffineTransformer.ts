import { forEachCoordinate, isNaNOrInfinite } from "../coordinate"

const NO_OP = 0
const TRANSLATE = 1
const SCALE = 2
const SHEAR = 4

/**
 * Class representing an affine transfomrm. Different to the java affine
 * transform in that transforms are always applied in forward order, and
 * provides a fluent interface.
 *
 * @author tofar
 */
export class AffineTransform {
    private static identity: AffineTransform
    readonly scaleX: number
    readonly shearX: number
    readonly shearY: number
    readonly scaleY: number
    readonly translateX: number
    readonly translateY: number
    readonly mode: number
    
    private constructor(scaleX: number, shearX: number, shearY: number, scaleY: number, translateX: number, translateY: number, mode: number) {
        this.scaleX = scaleX;
        this.shearX = shearX;
        this.shearY = shearY;
        this.scaleY = scaleY;
        this.translateX = translateX;
        this.translateY = translateY;
        this.mode = mode;
    }
    static getIdentity(): AffineTransform {
        let { identity } = AffineTransform
        if(!identity){
            AffineTransform.identity = identity = new AffineTransform(1, 0, 0, 1, 0, 0, NO_OP)
        }
        return identity
    }
    static valueOf(scaleX: number, shearX: number, shearY: number, scaleY: number, translateX: number, translateY: number): AffineTransform {
        if (isNaNOrInfinite(scaleX, shearX, translateX, shearY, scaleY, translateY)) {
            throw new Error(`Invalid transform (${scaleX}, ${shearX}, ${translateX}, ${shearY}, ${scaleY}, ${translateY})`)
        }
        const mode = calculateMode(scaleX, shearX, shearY, scaleY, translateX, translateY);
        return (mode == NO_OP) ? this.getIdentity() : new AffineTransform(scaleX, shearX, shearY, scaleY, translateX, translateY, mode);
    }
    getInverse(): AffineTransform {
        const { scaleX, scaleY, shearX, shearY, translateX, translateY, mode } = this
        const det = scaleX * scaleY - shearX * shearY;
        return new AffineTransform(
            scaleY / det,
            -shearX / det,
            -shearY / det,
            scaleX / det,
            (shearX * translateY - scaleY * translateX) / det,
            (shearY * translateX - scaleX * translateY) / det,
            mode
        );
    }

    /**
     * Place a transformed version of the source vector given in the destination
     * vector given
     *
     * @param src
     * @param dst
     * @throws NullPointerException if src or dst was null
     */
    transformCoordinates(coordinates: number[]): number[] {
        const { scaleX, scaleY, shearX, shearY, translateX, translateY, mode } = this
        if (mode === NO_OP) {
            return coordinates.slice()
        }
        const result = []
        forEachCoordinate(coordinates, (x, y) => {
            switch (mode) {
                case (SCALE | SHEAR):
                    result.push((scaleX * x) + (shearX * y),
                            (shearY * x) + (scaleY * y));
                    break;
                case (SCALE | TRANSLATE):
                    result.push((scaleX * x) + translateX,
                            (scaleY * y) + translateY);
                    return;
                case SCALE:
                    result.push((scaleX * x), (scaleY * y));
                    return;
                case (SHEAR | TRANSLATE):
                    result.push(x + (shearX * y) + translateX,
                            y + (shearY * x) + translateY);
                    return;
                case SHEAR:
                    result.push(x + (shearX * y), y + (shearY * x));
                    return;
                case TRANSLATE:
                    result.push(x + translateX,
                            y + translateY);
                    return;
                default: // apply all
                    result.push((scaleX * x) + (shearX * y) + translateX,
                            (shearY * x) + (scaleY * y) + translateY);
            }
        })
    }
    toArray(): number[] {
        const { scaleX, scaleY, shearX, shearY, translateX, translateY } = this
        return [scaleX, shearX, shearY, scaleY, translateX, translateY]
    }

    add(nScaleX: number, nShearX: number, nShearY: number, nScaleY: number, nTranslateX: number, nTranslateY: number): AffineTransform {
        const { scaleX, shearX, shearY, scaleY, translateX, translateY } = this
        return AffineTransform.valueOf(
            nScaleX * scaleX + nShearX * shearY,
            nScaleX * shearX + nShearX * scaleY,
            nShearY * scaleX + scaleY * shearY,
            nShearY * shearX + scaleY * scaleY,
            nScaleX * translateX + nShearX * translateY + translateX,
            nShearY * translateX + scaleY * translateY + translateY,
        )
    }
    scale(scaleX: number, scaleY?: number): AffineTransform {
        if(scaleY == null){
            scaleY = scaleX
        }
        if (isNaNOrInfinite(scaleX, scaleY) || !scaleX || !scaleY) {
            throw new Error(`Invalid transform (${scaleX}, ${scaleY})`)
        }
        return this.add(scaleX, 0, 0, scaleY, 0, 0)
    }
    scaleAround(scale: number, originX: number, originY: number): AffineTransform{
        return this.translate(-originX, -originY).scale(scale).translate(originX, originY)
    }
    rotateDegrees(degrees: number, originX?: number, originY?: number): AffineTransform{
        return this.rotateRadians(degrees*Math.PI/180, originX, originY)
    }
    rotateRadians(radians: number, originX?: number, originY?: number): AffineTransform{
        let sin = Math.sin(radians);
        let cos;
        if (sin == 1) { // 90
            cos = 0;
        } else if (sin == -1) { // 270
            cos = 0;
        }else{
            cos = Math.cos(radians);
            if (cos == 1) { // 0
                return this;
            } else if (cos == -1) { // 180
                sin = 0;
            }
        }
        let result: AffineTransform = this
        if(originX || originY){
            result = result.translate(-originX, -originY)
        }
        result = result.add(cos, -sin, sin, cos, 0, 0);
        if(originX || originY){
            result = result.translate(originX, originY)
        }
    }
    translate(x: number, y: number): AffineTransform{
        return this.add(1, 0, 0, 1, x || 0, y || 0);
    }
}


function calculateMode(scaleX: number, shearX: number, shearY: number, scaleY: number, translateX: number, translateY: number): number {
    let ret = NO_OP;
    if ((translateX != 0) || (translateY != 0)) {
        ret |= TRANSLATE;
    }
    if (!((scaleX == 1) && (scaleY == 1))) {
        ret |= SCALE;
    }
    if ((shearX != 0) || (shearY != 0)) {
        ret |= SHEAR;
    }
    return ret;
}
