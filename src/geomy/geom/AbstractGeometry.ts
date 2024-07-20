import { NumberFormatter } from "../formatter";
import { DISJOINT, Relation } from "../Relation";
import { Tolerance } from "../Tolerance";
import { Transformer } from "../transformer/Transformer";
import { Geometry } from "./Geometry";
import { MultiGeometry } from "./MultiGeometry";
import { Point } from "./Point";
import { Rectangle } from "./Rectangle";


export abstract class AbstractGeometry implements Geometry {
    protected centroid?: Point
    protected bounds?: Rectangle
    protected multiGeometry?: MultiGeometry
    getCentroid(): Point {
        let { centroid } = this
        if (!centroid){
            this.centroid = centroid = this.calculateCentroid()
        }
        return centroid
    }
    protected abstract calculateCentroid(): Point
    getBounds(): Rectangle {
        let { bounds } = this
        if (!bounds){
            this.bounds = bounds = this.calculateBounds()
        }
        return bounds
    }
    protected abstract calculateBounds(): Rectangle
    abstract walkPath(pathWalker: PathWalker): void
    abstract toWkt(numberFormatter?: NumberFormatter): string
    abstract toGeoJson(): any
    toMultiGeometry(tolerance: Tolerance): MultiGeometry {
        if (this.getBounds().isCollapsible(tolerance)){
            return this.getCentroid().toMultiGeometry()
        }
        let { multiGeometry } = this
        if (!multiGeometry) {
            this.multiGeometry = multiGeometry = this.calculateMultiGeometry()
        }
        return multiGeometry.generalize(tolerance)
    }
    protected abstract calculateMultiGeometry(): MultiGeometry
    abstract transform(transformer: Transformer, tolerance: Tolerance): Geometry
    abstract generalize(tolerance: Tolerance): Geometry
    relate(other: Geometry, tolerance: Tolerance): Relation {
        if(this.getBounds().isDisjointRectangle(other.getBounds(), tolerance)){
            return DISJOINT
        }
        return this.relateGeometry(other, tolerance)
    }
    protected abstract relateGeometry(other: Geometry, tolerance: Tolerance): Relation
    abstract union(other: Geometry, tolerance: Tolerance): Geometry
    intersection(other: Geometry, tolerance: Tolerance): Geometry | null {
        if(this.getBounds().isDisjointRectangle(other.getBounds(), tolerance)){
            return null
        }
        return this.intersectionGeometry(other, tolerance)
    }
    protected abstract intersectionGeometry(other: Geometry, tolerance: Tolerance): Geometry
    less(other: Geometry, tolerance: Tolerance): Geometry | null {
        if(this.getBounds().isDisjointRectangle(other.getBounds(), tolerance)){
            return this
        }
        return this.lessGeometry(other, tolerance)
    }
    protected abstract lessGeometry(other: Geometry, tolerance: Tolerance): Geometry
    xor(other: Geometry, tolerance: Tolerance): Geometry | null {
        return this.toMultiGeometry(tolerance).xor(other, tolerance)
    }
}