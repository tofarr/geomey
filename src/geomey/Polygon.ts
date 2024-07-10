import { LineString, douglasPeucker, eachSegment } from "./LineString";
import { Point, comparePoints } from "./Point";
import { PointCollection } from "./MultiPoint";


export class InvalidPolygonError extends Error {
    constructor(ring: LineString) {
        super(ring.toString())
    }
}


export class Polygon {
    readonly outerRing: LineString
    readonly holes?: ReadonlyArray<Polygon>
    area?: number

    constructor(outerRing: LineString, holes?: ReadonlyArray<Polygon>) {
        const { points } = outerRing.pointList
        if (points[0] != points[points.length-2] || points[1] != points[points.length-1]) {
            throw new InvalidPolygonError(outerRing)
        }
        this.outerRing = normalizeRing(outerRing)
        this.holes = holes?.length ? holes : undefined
    }

    getBounds() {
        return this.outerRing.getBounds()
    }

    getArea() {
        let { area } = this
        if (area == null) {
            const { outerRing, holes } = this
            area = calculatePolygonArea(outerRing.pointList)
            if (holes) {
                for(const hole of holes){
                    area -= hole.getArea()
                }
            }
            this.area = area
        }
        return area
    }

    generalize(accuracy: number): Polygon | Point {
        const outerRing = this.outerRing.generalize(accuracy)
        if (outerRing instanceof Point) {
            return outerRing
        }
        let holes = undefined
        if (this.holes && this.holes.length) {
            holes = []
            for(const hole of this.holes) {
                const generalized = hole.generalize(accuracy)
                if (hole instanceof Polygon){
                    holes.push(hole)
                }
            }
        }
        return new Polygon(outerRing as LineString, holes)
    }

    forEachLineSegment(visitor: (ax: number, ay: number, bx: number, by: number) => void | boolean) {

    }
}


function calculatePolygonArea(ring: PointCollection) {
    var total = 0;
    eachSegment(ring.points, (ax, ay, bx, by) => {
        total += (ax * by * 0.5);
        total -= (bx * ay * 0.5);
    })
    return total
}


function normalizeRing(ring: LineString) {
    const { pointList } = ring
    const { points } = pointList
    let minX = points[0]
    let minY = points[1]
    let minIndex = 0
    pointList.eachPoint((x, y, index) => {
        if(comparePoints(minX, minY, x, y) > 0){
            minX = x
            minY = y
            minIndex = index
        }
    })
    if (minIndex){
        if (minIndex > 0) {
            const p = points.slice(minIndex, points.length-2)
            p.push.apply(p, points.slice(0, minIndex))
            p.push(minX, minY)
            ring = new LineString(new PointCollection(p))
        }
    }
    if (calculatePolygonArea(ring.pointList) < 0) {
        ring = ring.reversed()
    }
    return ring
}
