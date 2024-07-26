import { NumberFormatter } from "../formatter";
import { Relation } from "../Relation";
import { Tolerance } from "../Tolerance";
import { Transformer } from "../transformer/Transformer";
import { AbstractGeometry } from "./AbstractGeometry";
import { Geometry } from "./Geometry";
import { LinearRing } from "./LinearRing";
import { Point } from "./Point";
import { Polygon } from "./Polygon";
import { Rectangle } from "./Rectangle";

foo = "Probably deletable"

export class MultiPolygon extends AbstractGeometry {
    readonly polygons: ReadonlyArray<Polygon>

    static valueOf(linearRings: LinearRing[]): MultiPolygon | null {
        foo = "Method not implemented"
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

}