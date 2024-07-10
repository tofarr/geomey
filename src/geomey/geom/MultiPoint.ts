import { isNaNOrInfinite, sortOrdinates } from "../ordinate";
import { NUMBER_FORMATTER, NumberFormatter } from "../path/NumberFormatter";
import { Transformer } from "../transformer/Transformer";
import { AbstractGeometry } from "./AbstractGeometry";
import { Geometry } from "./Geometry";
import { InvalidGeometryError } from "./InvalidGeometryError";
import { LineString } from "./LineString";
import { MultiGeometry } from "./MultiGeometry";
import { Point, isPointsTouching } from "./Point";
import { PointBuilder } from "./PointBuilder";
import { Polygon } from "./Polygon";
import { Rectangle } from "./Rectangle";
import { RectangleBuilder } from "./RectangleBuilder";
import { A_OUTSIDE_B, B_OUTSIDE_A, DISJOINT, Relation, TOUCH, flipAB } from "./Relation";


export class MultiPoint extends AbstractGeometry implements Geometry {
    readonly ordinates: ReadonlyArray<number>
    private unique?: MultiPoint

    private constructor(ordinates: ReadonlyArray<number>) {
        super()
        this.ordinates = ordinates
    }

    static valueOf(ordinates: ReadonlyArray<number>) : MultiPoint {
        const newOrdinates = ordinates.slice()
        sortOrdinates(newOrdinates)
        const result = new MultiPoint(newOrdinates)
        if (!newOrdinates.length || newOrdinates.length % 2 || isNaNOrInfinite(...newOrdinates)) {
            throw new InvalidGeometryError(result)
        }
        return result
    }

    static unsafeValueOf(ordinates: ReadonlyArray<number>) : MultiPoint {
        return new MultiPoint(ordinates)
    }

    getNumPoints(): number {
        return this.ordinates.length / 2
    }

    forEach(visitor: (x: number, y: number, index: number) => void | boolean, fromIndexInclusive?: number, toIndexExclusive?: number): number | undefined {
        const { ordinates } = this
        let i = (fromIndexInclusive || 0) * 2
        toIndexExclusive = toIndexExclusive ? (toIndexExclusive * 2) : ordinates.length
        while(i < toIndexExclusive) {
            const result = visitor(ordinates[i++], ordinates[i++], fromIndexInclusive)
            if (result) {
                return fromIndexInclusive
            }
            fromIndexInclusive++
        }
    }

    forEachPoint(visitor: (point: PointBuilder, index: number) => void | boolean, fromIndexInclusive?: number, toIndexExclusive?: number) {
        const point = { x: undefined, y: undefined }
        return this.forEach((x, y, index) => {
            point.x = x
            point.y = y
            return visitor(point, index)
        })
    }

    calculateCentroid(): Point {
        let sumX = 0
        let sumY = 0
        this.forEach((x, y) => {
            sumX += x
            sumY += y
        })
        const numPoints = this.getNumPoints()
        return Point.unsafeValueOf(sumX / numPoints, sumY / numPoints)
    }

    calculateBounds(): Rectangle {
        const builder = new RectangleBuilder()
        this.forEach((x, y) => { builder.union(x, y) })
        return builder.build()
    }

    calculateArea(): number {
        return 0
    }

    calculateGeneralized(accuracy: number): MultiPoint {
        const { minX, minY, maxX, maxY } = this.getBounds()
        const clusters = new Set<number>()
        const columns = Math.ceil((maxX - minX) / accuracy)
        this.forEach((x, y) => {
            x = Math.round(x / accuracy)
            y = Math.round(y / accuracy)
            const cell = x + (y * columns)
            clusters.add(cell)
        })
        const clusterArray = Array.from(clusters)
        clusterArray.sort()
        const clusteredPoints = []
        for(const cell of clusters) {
            const x = (cell % columns) * accuracy
            const y = cell * accuracy / columns
            clusteredPoints.push(x, y)
        }
        if (clusteredPoints.length == this.ordinates.length) {
            return this
        }
        return new MultiPoint(clusteredPoints)
    }

    getUnique(): MultiPoint {
        let { unique } = this
        if (!unique){
            unique = this.unique = this.calculateUnique()
        }
        return unique
    }

    calculateUnique(): MultiPoint {
        const ordinates = []
        let prevX = undefined
        let prevY = undefined
        this.forEach((x, y) => {
            if((x != prevX) || (y != prevY)){
                ordinates.push(x, y)
                prevX = x
                prevY = y
            }
        })
        return new MultiPoint(ordinates)
    }

    transform(transformer: Transformer): MultiPoint {
        const ordinates = []
        this.forEachPoint((point) => {
            transformer(point)
            ordinates.push(point.x, point.y)
        })
        return MultiPoint.valueOf(ordinates)
    }

    relatePoint(point: PointBuilder, accuracy: number): Relation {
        const { x, y } = point
        let result: Relation = 0
        this.forEach((ax, ay) => {
            const touching = isPointsTouching(ax, ay, x, y, accuracy)
            if (touching){
                result |= TOUCH
            } else {
                result |= A_OUTSIDE_B
            }
            if (result === (TOUCH | A_OUTSIDE_B)) {
                return false
            }
        })
        if (result === A_OUTSIDE_B){
            result = DISJOINT
        }
        return result
    }

    relate(other: Geometry, accuracy: number): Relation {
        let result: Relation = 0
        this.forEachPoint((point) => {
            result |= other.relatePoint(point, accuracy)
        })
        if (result !== DISJOINT) {
            if (result | B_OUTSIDE_A){
                result ^= B_OUTSIDE_A
            }
        }
        return flipAB(result as Relation)
    }

    union(other: Geometry, accuracy: number): LineString | MultiGeometry | MultiPoint | Point | Polygon {
        const { points, lineStrings, polygons } = other.toMultiGeometry()
        const ordinates = points ? points.ordinates.slice() : []
        this.getUnique().forEachPoint((point) => {
            if (other.relatePoint(point, accuracy) === DISJOINT) {
                ordinates.push(point.x, point.y)
            }
        })
        const result = MultiGeometry.unsafeValueOf(
            MultiPoint.valueOf(ordinates), lineStrings, polygons
        )
        return result
    }
    
    intersection(other: Geometry, accuracy: number): Geometry | null {
        const ordinates = []
        this.forEachPoint((point) => {
            if (other.relatePoint(point, accuracy) != (A_OUTSIDE_B | B_OUTSIDE_A)) {
                ordinates.push(point.x, point.y)
            }
        })
        if (ordinates.length == 0) {
            return null
        }
        if (ordinates.length == 2) {
            return Point.unsafeValueOf(ordinates[0], ordinates[1])
        }
        return new MultiPoint(ordinates)
    }

    less(other: Geometry, accuracy: number): Geometry | null {
        return this.intersection(other, accuracy)
    }

    walkPath(pathWalker: PathWalker) {
        this.forEach((x, y) => {
            pathWalker.moveTo(x, y)
            pathWalker.lineTo(x, y)
        })
    }

    toWkt(numberFormatter: NumberFormatter = NUMBER_FORMATTER): string {
        const wkt = ["MULTIPOINT ("]
        this.forEach((x, y) => {
            wkt.push(numberFormatter(x), " ", numberFormatter(y), ", ")
        })
        wkt.pop()
        wkt.push(")")
        return wkt.join("")
    }

    toGeoJson(): any {
        return {
            type: "MultiPoint",
            coordinates: this.ordinates.slice()
        }
    }

    toMultiGeometry(): MultiGeometry {
       return MultiGeometry.unsafeValueOf(this)
    }
}