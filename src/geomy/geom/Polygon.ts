
import { Relation } from "../Relation";
import { Tolerance } from "../Tolerance";
import { NumberFormatter } from "../formatter";
import { Transformer } from "../transformer/Transformer";
import { Geometry } from "./Geometry";
import { MultiGeometry } from "./MultiGeometry";
import { Point } from "./Point";
import { Rectangle } from "./Rectangle";


export class Polygon implements Geometry {
    static unsafeValueOf(linearRing: ReadonlyArray<number>, children?: ReadonlyArray<Polygon>): Polygon {
        throw new Error("Method not implemented.");
    }
    getCentroid(): Point {
        throw new Error("Method not implemented.");
    }
    getBounds(): Rectangle {
        throw new Error("Method not implemented.");
    }
    walkPath(pathWalker: PathWalker): void {
        throw new Error("Method not implemented.");
    }
    toWkt(numberFormatter?: NumberFormatter): string {
        throw new Error("Method not implemented.");
    }
    toGeoJson() {
        throw new Error("Method not implemented.");
    }
    toMultiGeometry(tolerance: Tolerance): MultiGeometry {
        throw new Error("Method not implemented.");
    }
    transform(transformer: Transformer): Geometry {
        throw new Error("Method not implemented.");
    }
    generalize(tolerance: Tolerance): Geometry {
        throw new Error("Method not implemented.");
    }
    relate(other: Geometry, tolerance: Tolerance): Relation {
        throw new Error("Method not implemented.");
    }
    union(other: Geometry, tolerance: Tolerance): Geometry {
        throw new Error("Method not implemented.");
    }
    intersection(other: Geometry, tolerance: Tolerance): Geometry | null {
        throw new Error("Method not implemented.");
    }
    less(other: Geometry, tolerance: Tolerance): Geometry | null {
        throw new Error("Method not implemented.");
    }
    
    
}


export type LinearRingConsumer = (polygon: Polygon) => boolean | void
