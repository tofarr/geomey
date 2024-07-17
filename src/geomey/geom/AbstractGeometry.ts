import { NumberFormatter } from "../path/NumberFormatter";
import { Transformer } from "../transformer/Transformer";
import { Geometry } from "./Geometry";
import { LineSegmentBuilder } from "./LineSegmentBuilder";
import { MultiGeometry } from "./MultiGeometry";
import { Point } from "./Point";
import { PointBuilder } from "./PointBuilder";
import { Rectangle } from "./Rectangle";
import { Relation } from "./Relation";


export abstract class AbstractGeometry implements Geometry {
    private centroid?: Point
    private bounds?: Rectangle
    private area?: number

    getCentroid(): Point {
        let { centroid } = this
        if (!centroid){
            centroid = this.centroid = this.calculateCentroid()
        }
        return centroid
    }

    abstract calculateCentroid(): Point

    getBounds(): Rectangle {
        let { bounds } = this
        if (!bounds){
            bounds = this.bounds = this.calculateBounds()
        }
        return bounds
    }

    abstract calculateBounds(): Rectangle

    getArea(): number {
        let { area } = this
        if (!area){
            area = this.area = this.calculateArea()
        }
        return area
    }

    abstract calculateArea(): number

    generalize(tolerance: number): Geometry {
        if (this.getBounds().isCollapsible(tolerance)){
            return this.getCentroid()
        }
        return this.calculateGeneralized(tolerance)
    }

    abstract calculateGeneralized(tolerance: number): Geometry

    abstract transform(transformer: Transformer): Geometry
    abstract relatePoint(point: PointBuilder, tolerance: number): Relation
    abstract relateLineSegment(lineSegment: LineSegmentBuilder, tolerance: number): Relation
    abstract relate(other: Geometry, tolerance: number): Relation
    abstract union(other: Geometry, tolerance: number): Geometry
    abstract intersection(other: Geometry, tolerance: number): Geometry | null
    abstract less(other: Geometry, tolerance: number): Geometry | null    
    abstract walkPath(pathWalker: PathWalker)
    abstract toWkt(numberFormat?: NumberFormatter): string
    abstract toGeoJson(): any
    abstract toMultiGeometry(): MultiGeometry
}