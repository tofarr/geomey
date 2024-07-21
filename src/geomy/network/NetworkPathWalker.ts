import { perpendicularDistance, signedPerpendicularDistance } from "../geom/LineSegment";
import { Network } from "./network";

export class NetworkPathWalker implements PathWalker {
    network: Network
    startX: number
    startY: number
    prevX: number
    prevY: number

    constructor(network: Network) {
        this.network = network
        this.startX = this.startY = this.prevX = this.prevY = undefined
    }
    moveTo(x: number, y: number): void {
        this.network.addVertex(x, y)
        this.startX = this.prevX = x;
        this.startY = this.prevY = y;
    }
    lineTo(x: number, y: number): void {
        const { prevX, prevY } = this
        if (prevX === x && prevY === y){
            return
        }
        this.network.addLink(prevX, prevY, x, y)
        this.prevX = x
        this.prevY = y
    }
    bezierCurveTo(bx: number, by: number, cx: number, cy: number, dx: number, dy: number): void {
        const { prevX: ax, prevY: ay } = this
        const { tolerance } = this.network
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