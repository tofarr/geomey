
import { DISJOINT, Relation, TOUCH } from "../Relation";
import { Tolerance } from "../Tolerance";
import { coordinateMatch, forEachCoordinate } from "../coordinate";
import { NUMBER_FORMATTER, NumberFormatter } from "../formatter";
import { Mesh } from "../mesh/Mesh";
import { MeshPathWalker } from "../mesh/MeshPathWalker";
import { generalize } from "../mesh/op/generalize";
import { Transformer } from "../transformer/Transformer";
import { AbstractGeometry } from "./AbstractGeometry";
import { Geometry } from "./Geometry";
import { coordinatesToWkt, createLineStrings, LineString } from "./LineString";
import { LinearRing } from "./LinearRing";
import { createPoints, Point, pointToWkt } from "./Point";
import { createPolygons, Polygon } from "./Polygon";
import { Rectangle } from "./Rectangle";
import { RectangleBuilder } from "./builder/RectangleBuilder";

const NO_POINTS: ReadonlyArray<number> = []
const NO_LINE_STRINGS: ReadonlyArray<LineString> = []
const NO_POLYGONS: ReadonlyArray<Polygon> = []

/**
 * Polygons of a multi geometry are expected to NOT overlap
 */
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
    static valueOf(tolerance: Tolerance, points?: ReadonlyArray<number>, lineStrings?: ReadonlyArray<LineString>, rings?: ReadonlyArray<LinearRing>): MultiGeometry {
        const pathWalker = MeshPathWalker.valueOf(tolerance)
        if(points){
            forEachCoordinate(points, (x, y) => {
                pathWalker.linesAndPoints.addVertex(x, y)
            })
        }
        if(lineStrings){
            for(const lineString of lineStrings){
                lineString.walkPath(pathWalker)
            }
        }
        if(rings){
            for(const ring of rings){
                ring.walkPath(pathWalker)
            }
        }
        return createMultiGeometry(pathWalker.rings, pathWalker.linesAndPoints)
    }
    static unsafeValueOf(points?: ReadonlyArray<number>, lineStrings?: ReadonlyArray<LineString>, polygons?: ReadonlyArray<Polygon>): MultiGeometry {
        return new MultiGeometry(points, lineStrings, polygons)
    }
    simplify(): Geometry {
        const { points, lineStrings, polygons } = this
        if (points.length / 2 + lineStrings.length + polygons.length != 1){
            return this
        }
        if(points.length){
            return Point.unsafeValueOf(points[0], points[1])
        }
        if(lineStrings.length){
            return lineStrings[0]
        }
        return polygons[0]
    }
    protected calculateCentroid(): Point {
        return this.getBounds().getCentroid()
    }
    protected calculateBounds(): Rectangle {
        const builder = new RectangleBuilder()
        builder.unionCoordinates(this.points)
        return builder.build() as Rectangle
    }
    walkPath(pathWalker: PathWalker): void {
        for(const polygon of this.polygons){
            polygon.walkPath(pathWalker)
        }
        for(const lineString of this.lineStrings){
            lineString.walkPath(pathWalker)
        }
        forEachCoordinate(this.points, (x, y) => {
            pathWalker.moveTo(x, y)
            pathWalker.lineTo(x, y)
        })
    }
    toWkt(numberFormatter: NumberFormatter = NUMBER_FORMATTER): string {
        const { points, lineStrings, polygons } = this
        if(points.length && !lineStrings.length && !polygons.length){
            if(points.length == 2){
                return pointToWkt(points[0], points[1], numberFormatter)
            }
            const result = ["MULTIPOINT"]
            coordinatesToWkt(points, numberFormatter, result)
            return result.join("")
        }
        if(!points.length && lineStrings.length && !polygons.length){
            if(lineStrings.length == 1){
                return lineStrings[0].toWkt(numberFormatter)
            }
            const result = ["MULTILINESTRING("]
            for(const lineString of lineStrings){
                coordinatesToWkt(lineString.coordinates, numberFormatter, result)  
                result.push(", ")  
            }
            result.pop()
            result.push(")")
            return result.join("")
        }
        if(!points.length && !lineStrings.length && polygons.length){
            if(polygons.length == 1){
                return polygons[0].toWkt(numberFormatter)
            }
            const result = ["MULTIPOLYGON("]
            for(const polygon of polygons){
                polygon.ringsToWkt(numberFormatter, false, result)
                result.push(", ")  
            }
            result.pop()
            result.push(")")
            return result.join("")
        }
        const result = ["GEOMETRYCOLLECTION("]
        for(const polygon of polygons){
            polygon.toWkt(numberFormatter)
            result.push(", ")
        }
        for(const lineString of lineStrings){
            lineString.toWkt(numberFormatter)
            result.push(", ")
        }
        forEachCoordinate(points, (x, y) => {
            result.push(pointToWkt(x, y, numberFormatter))
            result.push(", ")
        })
        result.push(")")
        return result.join("")
    }
    toGeoJson() {
        const geometries = []
        forEachCoordinate(this.points, (x, y) => { geometries.push({
            type: "Point", x, y
        })})
        for(const lineString of this.lineStrings){
            geometries.push(lineString.toGeoJson())
        }
        for(const polygon of this.polygons){
            geometries.push(polygon.toGeoJson())
        }
        return {
            "type": "GeometryCollection",
            geometries
        }
    }
    transform(transformer: Transformer, tolerance: Tolerance): Geometry {
        const pathWalker = MeshPathWalker.valueOf(tolerance)
        forEachCoordinate(transformer.transformAll(this.points), (x, y) => {
            pathWalker.moveTo(x, y)
            pathWalker.lineTo(x, y)
        })
        for(const lineString of this.lineStrings){
            lineString.transform(transformer).walkPath(pathWalker)
        }
        for(const polygon of this.polygons){
            polygon.transform(transformer, tolerance).walkPath(pathWalker)
        }
        return createMultiGeometry(pathWalker.rings, pathWalker.linesAndPoints)
    }
    generalize(tolerance: Tolerance): Geometry {
        const pathWalker = MeshPathWalker.valueOf(tolerance)
        forEachCoordinate(this.points, (x, y) => {
            pathWalker.moveTo(x, y)
            pathWalker.lineTo(x, y)
        })
        for(const lineString of this.lineStrings) {
            lineString.walkPath(pathWalker)
        }
        for(const polygon of this.polygons){
            polygon.walkPath(pathWalker)
        }
        generalize(pathWalker.rings, tolerance)
        generalize(pathWalker.linesAndPoints, tolerance)
        return createMultiGeometry(pathWalker.rings, pathWalker.linesAndPoints)
    }
    relatePoint(x: number, y: number, tolerance: Tolerance): Relation {
        if (this.getBounds().relatePoint(x, y, tolerance) == DISJOINT){
            return DISJOINT
        }
        const { points } = this
        let index = points.length
        while(index){
            if(coordinateMatch(points[--index], points[--index], y, x, tolerance)){
                return TOUCH
            }
        }
        for(const lineString of this.lineStrings) {
            if (lineString.relatePoint(x, y, tolerance) == TOUCH) {
                return TOUCH
            }
        }
        for(const polygon of this.polygons){
            const relation = polygon.relatePoint(x, y, tolerance)
            if(relation !== DISJOINT){
                return relation
            }
        }
        return DISJOINT
    }
}


export function createMultiGeometry(rings: Mesh, linesAndPoints: Mesh): MultiGeometry {
    return MultiGeometry.unsafeValueOf(
        createPoints(linesAndPoints),
        createLineStrings(linesAndPoints),
        createPolygons(rings)
    )
}
