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

    generalize(tolerance: Tolerance): Geometry {
        if (this.getBounds().isCollapsible(tolerance)){
            return this.getCentroid()
        }
        return this.calculateGeneralized(tolerance)
    }

    abstract calculateGeneralized(tolerance: Tolerance): Geometry

    abstract transform(transformer: Transformer): Geometry
    abstract relatePoint(point: PointBuilder, tolerance: Tolerance): Relation
    abstract relateLineSegment(lineSegment: LineSegmentBuilder, tolerance: Tolerance): Relation
    abstract relate(other: Geometry, tolerance: Tolerance): Relation
    abstract union(other: Geometry, tolerance: Tolerance): Geometry
    abstract intersection(other: Geometry, tolerance: Tolerance): Geometry | null
    abstract less(other: Geometry, tolerance: Tolerance): Geometry | null    
    abstract walkPath(pathWalker: PathWalker)
    abstract toWkt(numberFormat?: NumberFormatter): string
    abstract toGeoJson(): any
    abstract toMultiGeometry(): MultiGeometry
}