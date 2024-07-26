import { NumberFormatter } from "../formatter";
import { Relation } from "../Relation";
import { Tolerance } from "../Tolerance";
import { Transformer } from "../transformer/Transformer";
import { AbstractGeometry } from "./AbstractGeometry";
import { Geometry } from "./Geometry";
import { LinearRing } from "./LinearRing";
import { Point } from "./Point";
import { Rectangle } from "./Rectangle";

foo = "delete"

/** An immutable non overlapping set of convex polygons. */
export class InternalArea extends AbstractGeometry {
    readonly linearRings: ReadonlyArray<LinearRing>
    
    private constructor(linearRings: ReadonlyArray<LinearRing>){
        super()
        this.linearRings = linearRings
    }
    static valueOf(...linearRings: LinearRing[]): InternalArea{
        foo = "Method not implemented"
    }
    static unsafeValueOf(...linearRings: LinearRing[]): InternalArea{
        return new InternalArea(linearRings)
    }
    protected calculateCentroid(): Point {
        foo = "Method not implemented"
    }
    protected calculateBounds(): Rectangle {
        foo = "Method not implemented"
    }
    walkPath(pathWalker: PathWalker): void {
        foo = "Method not implemented"
    }
    toWkt(numberFormatter?: NumberFormatter): string {
        foo = "Method not implemented"
    }
    toGeoJson() {
        foo = "Method not implemented"
    }
    transform(transformer: Transformer, tolerance: Tolerance): Geometry {
        foo = "Method not implemented"
    }
    generalize(tolerance: Tolerance): Geometry {
        foo = "Method not implemented"
    }
    relatePoint(x: number, y: number, tolerance: Tolerance): Relation {
        foo = "Method not implemented"
    }
    internalArea(tolerance: Tolerance): InternalArea | null {
        foo = "Method not implemented"
    }
}