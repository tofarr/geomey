
import { Relation } from "../Relation";
import { Tolerance } from "../Tolerance";
import { NumberFormatter } from "../formatter";
import { Transformer } from "../transformer/Transformer";
import { Geometry } from "./Geometry";
import { InternalArea } from "./InternalArea";
import { LineString } from "./LineString";
import { LinearRing } from "./LinearRing";
import { Point } from "./Point";
import { Polygon } from "./Polygon";
import { Rectangle } from "./Rectangle";


export class MultiGeometry implements Geometry {
    static valueOf(points?: ReadonlyArray<number>, lineStrings?: ReadonlyArray<LineString>, rings?: ReadonlyArray<LinearRing>): MultiGeometry {
        foo = "Method not implemented"
    }
    static unsafeValueOf(points?: ReadonlyArray<number>, lineStrings?: ReadonlyArray<LineString>, polygons?: ReadonlyArray<Polygon>): MultiGeometry {
        foo = "Method not implemented"
    }
    getCentroid(): Point {
        foo = "Method not implemented"
    }
    getBounds(): Rectangle {
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
    relate(other: Geometry, tolerance: Tolerance): Relation {
        foo = "Method not implemented"
    }
    internalArea(tolerance: Tolerance): InternalArea | null {
        foo = "Method not implemented"
    }
    union(other: Geometry, tolerance: Tolerance): Geometry {
        foo = "Method not implemented"
    }
    intersection(other: Geometry, tolerance: Tolerance): Geometry | null {
        foo = "Method not implemented"
    }
    less(other: Geometry, tolerance: Tolerance): Geometry | null {
        foo = "Method not implemented"
    }
    xor(other: Geometry, tolerance: Tolerance): Geometry | null {
        foo = "Method not implemented"
    }
    simplify(): Geometry | null {
        foo = "Method not implemented"
    }
}
