import { CoordinateStore } from "../coordinate/CoordinateStore";
import { isNaNOrInfinite, sortOrdinates } from "../ordinate";
import { NUMBER_FORMATTER, NumberFormatter } from "../path/NumberFormatter";
import { Transformer } from "../transformer/Transformer";
import { AbstractMultiPoint } from "./AbstractMultiPoint";
import { Geometry } from "./Geometry";
import { InvalidGeometryError } from "./InvalidGeometryError";
import { LineString } from "./LineString";
import { MultiGeometry } from "./MultiGeometry";
import { Point, isPointsTouching } from "./Point";
import { PointBuilder } from "./PointBuilder";
import { Polygon } from "./Polygon";
import { A_OUTSIDE_B, B_OUTSIDE_A, DISJOINT, Relation, TOUCH, flipAB } from "./Relation";


export class MultiPoint extends AbstractMultiPoint {
    private unique?: MultiPoint

    protected constructor(coordinates: CoordinateStore) {
        super(coordinates)
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
        const cursor = this.getCursor()
        const point = { x: undefined, y: undefined }
        while(cursor.next(point)){
            transformer(point)
            ordinates.push(point.x, point.y)
        }
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
        const cursor = this.getCursor()
        const point = { x: undefined, y: undefined }
        while(cursor.next(point)){
            result |= other.relatePoint(point, accuracy)
        }
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
        const cursor = this.getUnique().getCursor()
        const point = { x: undefined, y: undefined }
        while(cursor.next(point)){
            if (other.relatePoint(point, accuracy) === DISJOINT) {
                ordinates.push(point.x, point.y)
            }
        }
        const result = MultiGeometry.unsafeValueOf(
            MultiPoint.valueOf(ordinates), lineStrings, polygons
        )
        return result
    }
    
    intersection(other: Geometry, accuracy: number): Geometry | null {
        const ordinates = []
        const cursor = this.getCursor()
        const point = { x: undefined, y: undefined }
        while(cursor.next(point)){
            if (other.relatePoint(point, accuracy) != (A_OUTSIDE_B | B_OUTSIDE_A)) {
                ordinates.push(point.x, point.y)
            }
        }
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