import { NumberFormatter } from "../formatter";
import { Relation } from "../Relation";
import { Tolerance } from "../Tolerance";
import { Transformer } from "../transformer/Transformer";
import { Geometry } from "./Geometry";
import { ringToWkt } from "./LinearRing";
import { coordinatesToWkt } from "./LineString";
import { Point } from "./Point";
import { Rectangle } from "./Rectangle";


export class Triangle implements Geometry {
    readonly ax: number
    readonly ay: number
    readonly bx: number
    readonly by: number
    readonly cx: number
    readonly cy: number
    bounds?: Rectangle
    centroid? Point

    private constructor(ax: number, ay: number, bx: number, by: number, cx: number, cy: number){
        this.ax = ax
        this.ay = ay
        this.bx = bx
        this.by = by
        this.cx = cx
        this.cy = cy
    }
    getCentroid(): Point {
        let { centroid } = this
        if (!centroid) {
            this.centroid = centroid = Point.unsafeValueOf(
                (this.ax + this.bx + this.cx) / 3,
                (this.ay + this.by + this.cy) / 3
            )
        }
        return centroid
    }
    getBounds(): Rectangle {
        let { bounds } = this
        if (!bounds) {
            this.bounds = bounds = Rectangle.valueOf([this.ax, this.ay, this.bx, this.by, this.cx, this.cy])
        }
        return bounds
    }
    walkPath(pathWalker: PathWalker): void {
        pathWalker.moveTo(this.ax, this.ay)
        pathWalker.lineTo(this.bx, this.by)
        pathWalker.lineTo(this.cx, this.cy)
        pathWalker.closePath()
    }
    toWkt(numberFormatter?: NumberFormatter): string {
        const { ax, ay, bx, by, cx, cy } = this
        const result = ["POLYGON("]
        ringToWkt([ax, ay, bx, by, cx, cy], numberFormatter, false, result)
        result.push(")")
        return result.join("")
    }
    toGeoJson() {
        const { ax, ay, bx, by, cx, cy } = this
        return {
            type: "POLYGON",
            coordinates: [
                [ax, ay],
                [bx, by],
                [cx, cy],
                [ax, ay],
            ]
        }
    }
    transform(transformer: Transformer, tolerance: Tolerance): Geometry {
        const { ax, ay, bx, by, cx, cy } = this
        return Triangle.valueOf.apply(transformer.transformAll([ax, ay, bx, by, cx, cy]))
    }
    generalize(tolerance: Tolerance): Geometry {
        if (this.getBounds().isCollapsible(tolerance)){
            return this.getCentroid()
        }
        return this
    }
    relatePoint(x: number, y: number, tolerance: Tolerance): Relation {
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
    xor(other: Geometry, tolerance: Tolerance): Geometry | null {
        throw new Error("Method not implemented.");
    }
    static valueOf(ax: number, ay: number, bx: number, by: number, cx: number, cy: number){
        return new Triangle(ax, ay, bx, by, cx, cy)
    }
    static unsafeValueOf(ax: number, ay: number, bx: number, by: number, cx: number, cy: number){
        return new Triangle(ax, ay, bx, by, cx, cy)
    }

}