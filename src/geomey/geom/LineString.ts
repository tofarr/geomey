import { coordinatesEqual } from "../coordinate";
import { Transformer } from "../transformer/Transformer";
import { AbstractLineString, douglasPeucker } from "./AbstractLineString";
import { Geometry } from "./Geometry";
import { MultiGeometry } from "./MultiGeometry";
import { PointBuilder } from "./PointBuilder";
import { Relation } from "./Relation";


export class LineString extends AbstractLineString {

    private selfIntersectionTolerance: number

    private constructor(ordinates: ReadonlyArray<number>, selfIntersectionTolerance: number) {
        super(ordinates)
        this.selfIntersectionTolerance = selfIntersectionTolerance
    }

    static valueOf(coordinates: ReadonlyArray<number>) : LineString {
        throw new Error("Method not implemented.");
    }

    static unsafeValueOf(coordinates: ReadonlyArray<number>) : LineString {
        throw new Error("Method not implemented.");
    }

    reverse(){
        return new LineString(this.reverseCoordinates(), this.selfIntersectionTolerance)
    }

    getExplicitSelfIntersections(tolerance: number) {
        // One of the first things any operation does is to get the linestring with
        // explicit points of self intersection. So we make this as fast as possible
        if (this.selfIntersectionTolerance >= tolerance){
            return this
        }
        const newCoordinates = this.getCoordinatesWithSelfIntersection(tolerance)
        if(coordinatesEqual(this.coordinates, newCoordinates)){
            this.selfIntersectionTolerance = tolerance
            return this
        }
        return new LineString(newCoordinates, tolerance)
    }

    calculateGeneralized(tolerance: number): Geometry {
        return new LineString(douglasPeucker(this.coordinates, tolerance), 0)
    }

    transform(transformer: Transformer): LineString {
        const coordinates = []
        this.forEachPoint((point) => {
            transformer(point)
            coordinates.push(point.x, point.y)
        })
        return LineString.valueOf(coordinates)
    }

    relatePoint(point: PointBuilder, tolerance: number): Relation {
        We need an "Is point on line tolerance method
        throw new Error("Method not implemented.");
    }

    relate(other: Geometry, tolerance: number): Relation {
        throw new Error("Method not implemented.");
    }

    union(other: Geometry, tolerance: number): Geometry {
        throw new Error("Method not implemented.");
    }

    intersection(other: Geometry, tolerance: number): Geometry | null {
        throw new Error("Method not implemented.");
    }

    less(other: Geometry, tolerance: number): Geometry | null {
        throw new Error("Method not implemented.");
    }

    walkPath(pathWalker: PathWalker) {
        const { coordinates } = this
        pathWalker.moveTo(coordinates[0], coordinates[1])
        this.forEachCoordinate(pathWalker.lineTo, 1)
    }

    toMultiGeometry(): MultiGeometry {
        return MultiGeometry.unsafeValueOf(
            undefined, [this]
        )
    }
}