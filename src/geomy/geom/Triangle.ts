import { NumberFormatter } from "../formatter";
import { Relation } from "../Relation";
import { Tolerance } from "../Tolerance";
import { Transformer } from "../transformer/Transformer";
import { Geometry } from "./Geometry";
import { Point } from "./Point";
import { Rectangle } from "./Rectangle";


class Triangle implements Geometry {
    readonly ax: number
    readonly ay: number
    readonly bx: number
    readonly by: number
    readonly cx: number
    readonly cy: number
    protected centroid?: Point
    protected bounds?: Rectangle

    private constructor(ax: number, ay: number, bx: number, by: number, cx: number, cy: number) {
        this.ax = ax
        this.ay = ay
        this.bx = bx
        this.by = by
        this.cx = cx
        this.cy = cy
    }
    getCentroid(): Point {
        let { centroid } = this
        if (!centroid){
            this.centroid = centroid = Point.valueOf(
                (this.ax + this.bx + this.cx) / 3,
                (this.ay + this.by + this.cy) / 3
            )
        }
        return centroid
    }
    getBounds(): Rectangle {
        let { bounds } = this
        if (!bounds){
            this.bounds = bounds = this.calculateBounds()
        }
        return bounds
    }
    walkPath(pathWalker: PathWalker): void {
        throw new Error("Method not implemented.");
    }
    toWkt(numberFormatter?: NumberFormatter): string {
        throw new Error("Method not implemented.");
    }
    toGeoJson() {
        throw new Error("Method not implemented.");
    }
    transform(transformer: Transformer, tolerance: Tolerance): Geometry {
        throw new Error("Method not implemented.");
    }
    generalize(tolerance: Tolerance): Geometry {
        throw new Error("Method not implemented.");
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
    
}