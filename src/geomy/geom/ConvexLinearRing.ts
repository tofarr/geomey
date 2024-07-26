import { crossProduct, forEachCoordinate } from "../coordinate";
import { NumberFormatter } from "../formatter";
import { Relation } from "../Relation";
import { Tolerance } from "../Tolerance";
import { Transformer } from "../transformer/Transformer";
import { AbstractGeometry } from "./AbstractGeometry";
import { Geometry } from "./Geometry";
import { forEachRingCoordinate, forEachRingLineSegmentCoordinates, ringToWkt } from "./LinearRing";
import { walkPath } from "./LineString";
import { MultiGeometry } from "./MultiGeometry";
import { Point } from "./Point";
import { Rectangle } from "./Rectangle";


foo = "delete"

export class ConvexLinearRing extends AbstractGeometry {
    readonly coordinates: ReadonlyArray<number> 
    private constructor(coordinates: ReadonlyArray<number>){
        super()
        this.coordinates = coordinates
    }
    protected calculateCentroid(): Point {
        let x = 0
        let y = 0
        let twiceArea = 0
        forEachRingLineSegmentCoordinates(this.coordinates, (ax, ay, bx, by) => {
            const f = (bx * ay) - (ax * by);
            twiceArea += f;
            x += (ax + bx) * f;
            y += (ay + by) * f;
        })
        const f = twiceArea * 3;
        return Point.valueOf(x / f, y / f);
    }
    protected calculateBounds(): Rectangle {
        return Rectangle.valueOf(this.coordinates)
    }
    walkPath(pathWalker: PathWalker): void {
        walkPath(this.coordinates, pathWalker)
        pathWalker.closePath()
    }
    toWkt(numberFormatter?: NumberFormatter): string {
        const result = ["POLYGON("]
        ringToWkt(this.coordinates, numberFormatter, false, result)
        result.push(")")
        return result.join("")
    }
    toGeoJson() {
        const coordinates = []
        forEachRingCoordinate(this.coordinates, (x, y) => { coordinates.push([x, y]) })
        return {
            type: "Polygon",
            coordinates
        }
    }
    transform(transformer: Transformer, tolerance: Tolerance): Geometry {
        const coordinates = transformer.transformAll(this.coordinates)
        const rings = LinearRing.valueOf(coordinates, tolerance)
        if (rings.length === 1){
            const [ring] = rings
            if (ring.getBounds().isCollapsible(tolerance)) {
                return ring.getCentroid()
            }
            return ring
        }
        return MultiGeometry.valueOf(null, null, rings)
    }
    generalize(tolerance: Tolerance): Geometry {
        foo = "Method not implemented"
    }
    relatePoint(x: number, y: number, tolerance: Tolerance): Relation {
        foo = "Method not implemented"
    }
    protected relateGeometry(other: Geometry, tolerance: Tolerance): Relation {
        foo = "Method not implemented"
    }
}


export function forEachAngle(coordinates: ReadonlyArray<number>, consumer: (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) => boolean | void) {
    const { length } = coordinates
    let ax = coordinates[length-2]
    let ay = coordinates[length-1]
    let bx = coordinates[0]
    let by = coordinates[1]
    forEachCoordinate(coordinates, (cx, cy) => {
        if(consumer(ax, ay, bx, by, cx, cy) === false){
            return
        }
        ax = bx
        ay = by
        bx = cx
        by = by
    }, 1, length >> 1)
}

export function isConvex(coordinates: ReadonlyArray<number>): boolean {
    let result = true
    forEachAngle(coordinates, (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) => {
        result = crossProduct(ax, ay, bx, by, cx, cy) > 0
        return result
    })
    return result
}
