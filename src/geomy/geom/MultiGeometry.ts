
import { Relation } from "../Relation";
import { Tolerance } from "../Tolerance";
import { NumberFormatter } from "../formatter";
import { Mesh } from "../mesh/Mesh";
import { Transformer } from "../transformer/Transformer";
import { AbstractGeometry } from "./AbstractGeometry";
import { Geometry } from "./Geometry";
import { createLineStrings, LineString } from "./LineString";
import { LinearRing } from "./LinearRing";
import { createPoints, Point } from "./Point";
import { createPolygons, Polygon } from "./Polygon";
import { Rectangle } from "./Rectangle";

const NO_POINTS: ReadonlyArray<number> = []
const NO_LINE_STRINGS: ReadonlyArray<LineString> = []
const NO_POLYGONS: ReadonlyArray<Polygon> = []


export class MultiGeometry extends AbstractGeometry {
    points: ReadonlyArray<number>
    lineStrings: ReadonlyArray<LineString>
    polygons: ReadonlyArray<Polygon>

    private constructor(points?: ReadonlyArray<number>, lineStrings?: ReadonlyArray<LineString>, polygons?: ReadonlyArray<Polygon>){
        super()
        this.points = points || NO_POINTS
        this.lineStrings = lineStrings || NO_LINE_STRINGS
        this.polygons = polygons || NO_POLYGONS
    }
    static valueOf(points?: ReadonlyArray<number>, lineStrings?: ReadonlyArray<LineString>, rings?: ReadonlyArray<LinearRing>): MultiGeometry {
        foo = "Method not implemented"
    }
    static unsafeValueOf(points?: ReadonlyArray<number>, lineStrings?: ReadonlyArray<LineString>, polygons?: ReadonlyArray<Polygon>): MultiGeometry {
        return new MultiGeometry(points, lineStrings, polygons)
    }
    simplify(): Geometry {
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


export function createMultiGeometry(rings: Mesh, linesAndPoints: Mesh): MultiGeometry {
    return MultiGeometry.unsafeValueOf(
        createPoints(linesAndPoints),
        createLineStrings(linesAndPoints),
        createPolygons(rings)
    )
}
