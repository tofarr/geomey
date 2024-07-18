import { isNaNOrInfinite, sortCoordinates } from "../coordinate";
import { NUMBER_FORMATTER, NumberFormatter } from "../path/NumberFormatter";
import { Transformer } from "../transformer/Transformer";
import { AbstractMultiPoint } from "./AbstractMultiPoint";
import { Geometry } from "./Geometry";
import { InvalidGeometryError } from "./InvalidGeometryError";
import { relateLineSegmentToPoint } from "./LineSegment";
import { LineSegmentBuilder } from "./LineSegmentBuilder";
import { MultiGeometry } from "./MultiGeometry";
import { Point, pointsMatch } from "./Point";
import { PointBuilder } from "./PointBuilder";
import { A_OUTSIDE_B, B_OUTSIDE_A, DISJOINT, Relation, TOUCH, flipAB } from "./Relation";


export class MultiPoint extends AbstractMultiPoint {
    private unique?: MultiPoint

    protected constructor(coordinates: ReadonlyArray<number>) {
        super(coordinates)
    }

    static valueOf(coordinates: ReadonlyArray<number>) : MultiPoint {
        const newCoordinates = coordinates.slice()
        sortCoordinates(newCoordinates)
        const result = new MultiPoint(newCoordinates)
        if (!newCoordinates.length || newCoordinates.length % 2 || isNaNOrInfinite(...newCoordinates)) {
            throw new InvalidGeometryError(result)
        }
        return result
    }

    static unsafeValueOf(ordinates: ReadonlyArray<number>) : MultiPoint {
        return new MultiPoint(ordinates)
    }

    calculateGeneralized(tolerance: Tolerance): MultiPoint {
        const { minX, minY, maxX, maxY } = this.getBounds()
        const clusters = new Set<number>()
        const columns = Math.ceil((maxX - minX) / tolerance)
        this.forEachCoordinate((x, y) => {
            x = Math.round(x / tolerance)
            y = Math.round(y / tolerance)
            const cell = x + (y * columns)
            clusters.add(cell)
        })
        const clusterArray = Array.from(clusters)
        clusterArray.sort()
        const clusteredPoints = []
        for(const cell of clusters) {
            const x = (cell % columns) * tolerance
            const y = cell * tolerance / columns
            clusteredPoints.push(x, y)
        }
        if (clusteredPoints.length == this.coordinates.length) {
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
        this.forEachCoordinate((x, y) => {
            if((x != prevX) || (y != prevY)){
                ordinates.push(x, y)
                prevX = x
                prevY = y
            }
        })
        return new MultiPoint(ordinates)
    }

    transform(transformer: Transformer): MultiPoint {
        const coordinates = []
        this.forEachPoint((point) => {
            transformer(point)
            coordinates.push(point.x, point.y)
        })
        return MultiPoint.valueOf(coordinates)
    }

    relatePoint(point: PointBuilder, tolerance: Tolerance): Relation {
        const { x, y } = point
        let result: Relation = 0
        this.forEachCoordinate((ax, ay) => {
            const touching = pointsMatch(ax, ay, x, y, tolerance)
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

    relateLineSegment(lineSegment: LineSegmentBuilder, tolerance: Tolerance): Relation {
        let touch = 0
        let bOutsideA = 0
        this.forEachCoordinate((x, y) => {
            const relation = relateLineSegmentToPoint(lineSegment, x, y, tolerance)
            touch ||= (relation & TOUCH)
            bOutsideA ||= (relation & A_OUTSIDE_B)
            return !(touch || bOutsideA)
        })
        return (touch | bOutsideA) as Relation
    }

    relate(other: Geometry, tolerance: Tolerance): Relation {
        let result: Relation = 0
        this.forEachPoint((point) => {
            result |= other.relatePoint(point, tolerance)
        })
        if (result !== DISJOINT) {
            if (result | B_OUTSIDE_A){
                result ^= B_OUTSIDE_A
            }
        }
        return flipAB(result as Relation)
    }

    union(other: Geometry, tolerance: Tolerance): Geometry {
        const coordinates = []
        this.getUnique().forEachPoint((point) => {
            if (other.relatePoint(point, tolerance) === DISJOINT) {
                coordinates.push(point.x, point.y)
            }
        })
        if (!coordinates) {
            return other
        }
        let otherMultiGeometry = other.toMultiGeometry()
        let { points } = otherMultiGeometry
        if (points){
            coordinates.push.apply(coordinates, points.coordinates)
            points = MultiPoint.valueOf(coordinates)
        } else {
            points = new MultiPoint(coordinates)
        }
        return MultiGeometry.unsafeValueOf(
            points, otherMultiGeometry.lineStrings, otherMultiGeometry.polygons
        ).normalize()
    }
    
    intersection(other: Geometry, tolerance: Tolerance): Geometry | null {
        const coordinates = []
        this.forEachPoint((point) => {
            if (other.relatePoint(point, tolerance) != (A_OUTSIDE_B | B_OUTSIDE_A)) {
                coordinates.push(point.x, point.y)
            }
        })
        if (coordinates.length == 0) {
            return null
        }
        if (coordinates.length == 2) {
            return Point.unsafeValueOf(coordinates[0], coordinates[1])
        }
        return new MultiPoint(coordinates)
    }

    less(other: Geometry, tolerance: Tolerance): Geometry | null {
        return this.intersection(other, tolerance)
    }

    walkPath(pathWalker: PathWalker): void {
        this.forEachCoordinate((x, y) => {
            pathWalker.moveTo(x, y)
            pathWalker.lineTo(x, y)
        })
    }

    toWkt(numberFormatter: NumberFormatter = NUMBER_FORMATTER): string {
        const wkt = ["MULTIPOINT ("]
        this.forEachCoordinate((x, y) => {
            wkt.push(numberFormatter(x), " ", numberFormatter(y), ", ")
        })
        wkt.pop()
        wkt.push(")")
        return wkt.join("")
    }

    toGeoJson(): any {
        return {
            type: "MultiPoint",
            coordinates: this.coordinates.slice()
        }
    }

    toMultiGeometry(): MultiGeometry {
       return MultiGeometry.unsafeValueOf(this)
    }
}