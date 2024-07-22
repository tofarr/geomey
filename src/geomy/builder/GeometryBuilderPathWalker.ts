import { Geometry } from "../geom/Geometry";
import { perpendicularDistance, signedPerpendicularDistance } from "../geom/LineSegment";
import { Tolerance } from "../Tolerance";
import { GeometryBuilder } from "./GeometryBuilder";

export class GeometryBuilderPathWalker implements PathWalker {
    geometrybuilder: GeometryBuilder
    startX: number
    startY: number
    prevX: number
    prevY: number

    constructor(geometrybuilder: GeometryBuilder) {
        this.geometrybuilder = geometrybuilder
        this.startX = this.startY = this.prevX = this.prevY = undefined
    }
    moveTo(x: number, y: number): void {
        this.geometrybuilder.addVertex(x, y)
        this.startX = this.prevX = x;
        this.startY = this.prevY = y;
    }
    lineTo(x: number, y: number): void {
        const { prevX, prevY } = this
        if (prevX === x && prevY === y){
            return
        }
        this.geometrybuilder.addLink(prevX, prevY, x, y)
        this.prevX = x
        this.prevY = y
    }
    bezierCurveTo(bx: number, by: number, cx: number, cy: number, dx: number, dy: number): void {
        const { prevX: ax, prevY: ay } = this
        const { tolerance } = this.geometrybuilder
        if(
            tolerance.match(0, signedPerpendicularDistance(ax, ay, dx, dy, bx, by)) &&
            tolerance.match(0, signedPerpendicularDistance(ax, ay, dx, dy, cx, cy))
        ) {
            this.lineTo(dx, dy)
            return
        }

        const abx = mid(ax, bx);
        const aby = mid(ay, by);
        const bcx = mid(bx, cx);
        const bcy = mid(by, cy);
        const cdx = mid(cx, dx);
        const cdy = mid(cy, dy);
        
        const abcx = mid(abx, bcx);
        const abcy = mid(aby, bcy);
        const bcdx = mid(bcx, cdx);
        const bcdy = mid(bcy, cdy);
        
        const abcdx = mid(abcx, bcdx);
        const abcdy = mid(abcy, bcdy);

        this.bezierCurveTo(abx, aby, abcx, abcy, abcdx, abcdy)
        this.bezierCurveTo(bcdx, bcdy, cdx, cdy, dx, dy)

    }
    closePath(): void {
        this.lineTo(this.startX, this.startY)
    }
}


function mid(a, b){
    return (a + b) / 2
}


export function createBuilder(tolerance: Tolerance, ...geometries: Geometry[]) {
    const builder = new GeometryBuilder(tolerance)
    const pathWalker = new GeometryBuilderPathWalker(builder)
    for (const geometry of geometries) {
        geometry.walkPath(pathWalker)
    }
    return builder
}
