
import { Relation } from "../Relation";
import { Tolerance } from "../Tolerance";
import { CoordinateConsumer, forEachCoordinate, forEachLineSegmentCoordinates, LineSegmentCoordinatesConsumer } from "../coordinate";
import { NUMBER_FORMATTER, NumberFormatter } from "../formatter";
import { Transformer } from "../transformer/Transformer";
import { AbstractGeometry } from "./AbstractGeometry";
import { Geometry } from "./Geometry";
import { coordinatesToWkt, walkPath } from "./LineString";
import { LinearRing } from "./LinearRing";
import { MultiGeometry } from "./MultiGeometry";
import { Point } from "./Point";
import { Rectangle } from "./Rectangle";


/**
 * A polygon is a non self intersecting linear ring of coordinates. Unlike WKT, the first coordinate is not
 * repeated at the end of the coordinate array. The shell of a valid polygon will not self intersect.
 *
 * A polygon may contain child polygons which serve as holes. These must be fully contained inside and not touch
 * the outer shell, and must not touch or overlap with each other.
 */
export class Polygon extends AbstractGeometry {
    readonly shell: ReadonlyArray<number>
    readonly children?: ReadonlyArray<Polygon>
    static valueOf(rings: ReadonlyArray<number>[], tolerance: Tolerance): Polygon[] {
        foo = "Method not implemented"
    }
    static unsafeValueOf(linearRing: LinearRing, children?: ReadonlyArray<Polygon>): Polygon {
        foo = "Method not implemented"
    }
    protected calculateCentroid(): Point {
        return calculateCentroid(this.shell)
    }
    protected calculateBounds(): Rectangle {
        return Rectangle.valueOf(this.shell)
    }
    walkPath(pathWalker: PathWalker): void {
        walkPath(this.shell, pathWalker)
        pathWalker.closePath()
    }
    protected ringsToWkt(numberFormatter: NumberFormatter, reverse: boolean, result: string[]){
        ringToWkt(this.shell, numberFormatter, reverse, result)
        const { children } = this
        if (children) {
            for(const child of children){
                result.push(", ")
                child.ringsToWkt(numberFormatter, !reverse, result)
            }
        }
    }
    toWkt(numberFormatter: NumberFormatter =  NUMBER_FORMATTER): string {
        const result = ["POLYGON("]
        this.ringsToWkt(numberFormatter, false, result)
        result.push(")")
        return result.join("")
    }
    protected ringsToGeoJson(reverse: boolean, result: number[][]){
        const shell = []
        forEachRingCoordinate(this.shell, (x, y) => { shell.push([x, y]) }, reverse)
        result.push(shell)
        const { children } = this
        if (children) {
            for(const child of children){
                child.ringsToGeoJson(!reverse, result)
            }
        }
    }
    toGeoJson() {
        const coordinates = []
        this.ringsToGeoJson(false, coordinates)
        return {
            type: "Polygon",
            coordinates
        }
    }
    protected calculateMultiGeometry(): MultiGeometry {
        return MultiGeometry.unsafeValueOf(undefined, undefined, [this])
    }
    protected transformRings(transformer: Transformer, result: ReadonlyArray<number>[]) {
        result.push(transformer.transformAll(this.shell))
        const { children } = this
        if (children) {
            for(const child of children){
                child.transformRings(transformer, result)
            }
        }
    }
    transform(transformer: Transformer, tolerance: Tolerance): Polygon | MultiGeometry {
        const rings = []
        this.transformRings(transformer, rings)
        const polygons = Polygon.valueOf(rings, tolerance)
        if (polygons.length === 1) {
            return polygons[0]
        }
        return MultiGeometry.unsafeValueOf(undefined, undefined, polygons)
    }
    generalize(tolerance: Tolerance): Geometry {
        foo = "Method not implemented"
    }
    protected relateGeometry(other: Geometry, tolerance: Tolerance): Relation {
        foo = "Method not implemented"
    }
    union(other: Geometry, tolerance: Tolerance): Geometry {
        foo = "Method not implemented"
    }
    protected intersectionGeometry(other: Geometry, tolerance: Tolerance): Geometry {
        foo = "Method not implemented"
    }
    protected lessGeometry(other: Geometry, tolerance: Tolerance): Geometry {
        foo = "Method not implemented"
    }
}
