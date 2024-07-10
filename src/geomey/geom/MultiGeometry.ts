import { LineString } from "../LineString";
import { NumberFormatter } from "../path/NumberFormatter";
import { Transformer } from "../transformer/Transformer";
import { AbstractGeometry } from "./AbstractGeometry";
import { Geometry } from "./Geometry";
import { MultiPoint } from "./MultiPoint";
import { Point } from "./Point";
import { PointBuilder } from "./PointBuilder";
import { Polygon } from "./Polygon";
import { Rectangle } from "./Rectangle";
import { Relation } from "./Relation";


export class MultiGeometry extends AbstractGeometry {
    readonly points: MultiPoint
    readonly lineStrings: ReadonlyArray<LineString>
    readonly polygons: ReadonlyArray<Polygon>

    private constructor(points?: MultiPoint, lineStrings?: ReadonlyArray<LineString>, polygons?: ReadonlyArray<Polygon>) {
        super()
        this.points = points
        this.lineStrings = lineStrings
        this.polygons = polygons
    }

    static valueOf(points?: MultiPoint, lineStrings?: ReadonlyArray<LineString>, polygons?: ReadonlyArray<Polygon>) : MultiGeometry {
        throw new Error("Method not implemented.");
    }

    static unsafeValueOf(points?: MultiPoint, lineStrings?: ReadonlyArray<LineString>, polygons?: ReadonlyArray<Polygon>) : MultiGeometry {
        return new MultiGeometry(points, lineStrings, polygons)
    }
    
    normalize(): LineString | MultiGeometry | MultiPoint | Point | Polygon {
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