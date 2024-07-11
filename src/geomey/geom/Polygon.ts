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

    calculateGeneralized(accuracy: number): Geometry {
        throw new Error("Method not implemented.");
    }

    transform(transformer: Transformer): Geometry {
        throw new Error("Method not implemented.");
    }

    relatePoint(point: PointBuilder, accuracy: number): Relation {
        throw new Error("Method not implemented.");
    }

    relate(other: Geometry, accuracy: number): Relation {
        throw new Error("Method not implemented.");
    }

    union(other: Geometry, accuracy: number): Geometry {
        throw new Error("Method not implemented.");
    }

    intersection(other: Geometry, accuracy: number): Geometry | null {
        throw new Error("Method not implemented.");
    }

    less(other: Geometry, accuracy: number): Geometry | null {
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
        throw new Error("Method not implemented.");
    }
}