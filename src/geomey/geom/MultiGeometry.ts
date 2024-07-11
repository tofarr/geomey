import { LineString } from "./LineString";
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
    
    async calculateCentroid(): Promise<Point> {
        throw new Error("Method not implemented.");
    }

    async calculateBounds(): Promise<Rectangle> {
        throw new Error("Method not implemented.");
    }

    async calculateArea(): Promise<number> {
        throw new Error("Method not implemented.");
    }

    async calculateGeneralized(accuracy: number): Promise<Geometry> {
        throw new Error("Method not implemented.");
    }

    async transform(transformer: Transformer): Promise<Geometry> {
        throw new Error("Method not implemented.");
    }

    async relatePoint(point: PointBuilder, accuracy: number): Promise<Relation> {
        throw new Error("Method not implemented.");
    }

    async relate(other: Geometry, accuracy: number): Promise<Relation> {
        throw new Error("Method not implemented.");
    }

    async union(other: Geometry, accuracy: number): Promise<Geometry> {
        throw new Error("Method not implemented.");
    }

    async intersection(other: Geometry, accuracy: number): Promise<Geometry | null> {
        throw new Error("Method not implemented.");
    }

    async less(other: Geometry, accuracy: number): Promise<Geometry | null> {
        throw new Error("Method not implemented.");
    }

    async walkPath(pathWalker: PathWalker): Promise<PathWalker> {
        throw new Error("Method not implemented.");
    }

    async toWkt(numberFormat?: NumberFormatter): Promise<string> {
        throw new Error("Method not implemented.");
    }

    async toGeoJson(): Promise<any> {
        throw new Error("Method not implemented.");
    }

    async toMultiGeometry(): Promise<MultiGeometry> {
        throw new Error("Method not implemented.");
    }
}