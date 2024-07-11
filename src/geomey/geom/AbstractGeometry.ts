import { NumberFormatter } from "../path/NumberFormatter";
import { Transformer } from "../transformer/Transformer";
import { Geometry } from "./Geometry";
import { MultiGeometry } from "./MultiGeometry";
import { Point } from "./Point";
import { Rectangle } from "./Rectangle";
import { Relation } from "./Relation";


export abstract class AbstractGeometry implements Geometry {
    private centroid?: Promise<Point>
    private bounds?: Promise<Rectangle>
    private area?: Promise<number>

    getCentroid(): Promise<Point> {
        let { centroid } = this
        if (!centroid){
            centroid = this.centroid = this.calculateCentroid()
        }
        return centroid
    }

    abstract calculateCentroid(): Promise<Point>

    getBounds(): Promise<Rectangle> {
        let { bounds } = this
        if (!bounds){
            bounds = this.bounds = this.calculateBounds()
        }
        return bounds
    }

    abstract calculateBounds(): Promise<Rectangle>

    getArea(): Promise<number> {
        let { area } = this
        if (!area){
            area = this.area = this.calculateArea()
        }
        return area
    }

    abstract calculateArea(): Promise<number>

    async generalize(accuracy: number): Promise<Geometry> {
        const bounds = await this.getBounds()
        if (bounds.isCollapsible(accuracy)){
            return this.getCentroid()
        }
        return this.calculateGeneralized(accuracy)
    }

    abstract calculateGeneralized(accuracy: number): Promise<Geometry>
    abstract transform(transformer: Transformer): Promise<Geometry>
    abstract relatePoint(point: Point, accuracy: number): Promise<Relation>
    abstract relate(other: Geometry, accuracy: number): Promise<Relation>
    abstract union(other: Geometry, accuracy: number): Promise<Geometry>
    abstract intersection(other: Geometry, accuracy: number): Promise<Geometry | null>
    abstract less(other: Geometry, accuracy: number): Promise<Geometry | null>
    abstract walkPath(pathWalker: PathWalker): Promise<PathWalker>
    abstract toWkt(numberFormat?: NumberFormatter): Promise<string>
    abstract toGeoJson(): Promise<any>
    abstract toMultiGeometry(): Promise<MultiGeometry>
}
