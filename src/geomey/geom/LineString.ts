import { NumberFormatter } from "../path/NumberFormatter";
import { Transformer } from "../transformer/Transformer";
import { AbstractMultiPoint } from "./AbstractMultiPoint";
import { Geometry } from "./Geometry";
import { MultiGeometry } from "./MultiGeometry";
import { MultiPoint } from "./MultiPoint";
import { Point } from "./Point";
import { PointBuilder } from "./PointBuilder";
import { Rectangle } from "./Rectangle";
import { Relation } from "./Relation";


export class LineString extends AbstractMultiPoint {

    private constructor(ordinates: ReadonlyArray<number>) {
        super(ordinates)
    }

    static valueOf(ordinates: ReadonlyArray<number>) : LineString {
        throw new Error("Method not implemented.");
    }

    static unsafeValueOf(ordinates: ReadonlyArray<number>) : LineString {
        throw new Error("Method not implemented.");
    }

    reverse(){
        const { ordinates } = this
        const reversed = new Array(ordinates.length)
        let i = ordinates.length
        while(i) {
            const y = ordinates[--i]
            const x = ordinates[--i]
            reversed.push(x, y)
        }
        return new LineString(reversed)
    }

    normalize(){
        // make any points of self intersection explicit.
        // if ring
            // rotate so first is min
        // else
            // reverse so first is min
        throw new Error("Method not implemented.");
    }

    isRing() {
        throw new Error("Method not implemented.");
    }

    isSelfIntersecting() {
        throw new Error("Method not implemented.");
    }

    calculateGeneralized(tolerance: number): Geometry {
        throw new Error("Method not implemented.");
    }

    transform(transformer: Transformer): Geometry {
        throw new Error("Method not implemented.");
    }

    relatePoint(point: PointBuilder, tolerance: number): Relation {
        throw new Error("Method not implemented.");
    }

    relate(other: Geometry, tolerance: number): Relation {
        throw new Error("Method not implemented.");
    }

    union(other: Geometry, tolerance: number): Geometry {
        throw new Error("Method not implemented.");
    }

    intersection(other: Geometry, tolerance: number): Geometry | null {
        throw new Error("Method not implemented.");
    }

    less(other: Geometry, tolerance: number): Geometry | null {
        throw new Error("Method not implemented.");
    }

    walkPath(pathWalker: PathWalker) {
        throw new Error("Method not implemented.");
    }

    toWkt(numberFormat?: NumberFormatter): string {
        throw new Error("Method not implemented.");
    }

    toGeoJson(): any {
        throw new Error("Method not implemented.");
    }

    toMultiGeometry(): MultiGeometry {
        return MultiGeometry.unsafeValueOf(
            undefined, [this]
        )
    }
}