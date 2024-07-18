import { NumberFormatter } from "../path/NumberFormatter";
import { Transformer } from "../transformer/Transformer";
import { AbstractGeometry } from "./AbstractGeometry";
import { Geometry } from "./Geometry";
import { LineString } from "./LineString";
import { MultiGeometry } from "./MultiGeometry";
import { Point } from "./Point";
import { PointBuilder } from "./PointBuilder";
import { Rectangle } from "./Rectangle";
import { Relation } from "./Relation";


export class Polygon extends AbstractGeometry {
    readonly ordinates: ReadonlyArray<number>

    private constructor(ordinates: ReadonlyArray<number>) {
        super()
        this.ordinates = ordinates
    }

    static valueOf(outerRing: LineString, holes?: ReadonlyArray<LineString>) : Polygon {
        throw new Error("Method not implemented.");
    }
    
    static unsafeValueOf(outerRing: LineString, holes?: ReadonlyArray<LineString>) : Polygon {
        throw new Error("Method not implemented.");
    }

    calculateCentroid(): Point {
        throw new Error("Method not implemented.");
    }

    calculateBounds(): Rectangle {
        throw new Error("Method not implemented.");
    }

    calculateArea(): number {
        throw new Error("Method not implemented.");
    }

    calculateGeneralized(tolerance: Tolerance): Geometry {
        throw new Error("Method not implemented.");
    }

    transform(transformer: Transformer): Geometry {
        throw new Error("Method not implemented.");
    }

    relatePoint(point: PointBuilder, tolerance: Tolerance): Relation {
        throw new Error("Method not implemented.");
    }

    relate(other: Geometry, tolerance: Tolerance): Relation {
        throw new Error("Method not implemented.");
    }

    union(other: Geometry, tolerance: Tolerance): Geometry {
        throw new Error("Method not implemented.");
    }

    intersection(other: Geometry, tolerance: Tolerance): Geometry | null {
        throw new Error("Method not implemented.");
    }

    less(other: Geometry, tolerance: Tolerance): Geometry | null {
        throw new Error("Method not implemented.");
    }

    walkPath(pathWalker: PathWalker): void {
        throw new Error("Method not implemented.");
    }

    toWkt(numberFormat?: NumberFormatter): string {
        throw new Error("Method not implemented.");
    }

    toGeoJson(): any {
        throw new Error("Method not implemented.");
    }

    toMultiGeometry(): MultiGeometry {
        throw new Error("Method not implemented.");
    }
}