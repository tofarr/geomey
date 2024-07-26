
import { A_INSIDE_B, B_INSIDE_A, B_OUTSIDE_A, Relation, TOUCH } from "../Relation";
import { Tolerance } from "../Tolerance";
import { NUMBER_FORMATTER, NumberFormatter } from "../formatter";
import { Mesh } from "../mesh/Mesh";
import { MeshPathWalker } from "../mesh/MeshPathWalker";
import { Transformer } from "../transformer/Transformer";
import { AbstractGeometry } from "./AbstractGeometry";
import { Geometry } from "./Geometry";
import { LineSegment } from "./LineSegment";
import { LineString } from "./LineString";
import { createLinearRings, forEachRingCoordinate, forEachRingLineSegmentCoordinates, LinearRing, ringToWkt } from "./LinearRing";
import { MultiGeometry } from "./MultiGeometry";
import { Point } from "./Point";
import { Rectangle } from "./Rectangle";
import { PolygonBuilder } from "./builder/PolygonBuilder";


const NO_CHILDREN: ReadonlyArray<Polygon> = []

/**
 * A polygon is a non self intersecting linear ring of coordinates. Unlike WKT, the first coordinate is not
 * repeated at the end of the coordinate array. The shell of a valid polygon will not self intersect.
 *
 * A polygon may contain child polygons which serve as holes. These must be fully contained inside and not touch
 * the outer shell, and must not touch or overlap with each other.
 */
export class Polygon extends AbstractGeometry {
    readonly shell: LinearRing
    readonly children: ReadonlyArray<Polygon>
    
    private constructor(shell: LinearRing, children: ReadonlyArray<Polygon>) {
        super()
        this.shell = shell
        this.children = children || NO_CHILDREN
    }
    static valueOf(rings: ReadonlyArray<LinearRing>, tolerance: Tolerance): Polygon[] {
        const mesh = new Mesh(tolerance)
        for (const ring of rings){
            forEachRingLineSegmentCoordinates(ring.coordinates, (ax, ay, bx, by) => {
                mesh.addLink(ax, ay, bx, by)
            })
        }
        return createPolygons(mesh)
    }
    static unsafeValueOf(shell: LinearRing, children?: ReadonlyArray<Polygon>): Polygon {
        return new Polygon(shell, children)
    }
    protected calculateCentroid(): Point {
        return this.shell.getCentroid()
    }
    protected calculateBounds(): Rectangle {
        return this.shell.getBounds()
    }
    walkPath(pathWalker: PathWalker): void {
        // Walk in reverse
        this.shell.walkPath(pathWalker)
        const { children } = this
        for (const child of children) {
            child.walkPathReverse(pathWalker)
        }
    }
    walkPathReverse(pathWalker: PathWalker): void {
        this.shell.walkPathReverse(pathWalker)
        for (const child of this.children) {
            child.walkPath(pathWalker)
        }
    }
    protected ringsToWkt(numberFormatter: NumberFormatter, reverse: boolean, result: string[]){
        ringToWkt(this.shell.coordinates, numberFormatter, reverse, result)
        for(const child of this.children){
            result.push(", ")
            child.ringsToWkt(numberFormatter, !reverse, result)
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
        forEachRingCoordinate(this.shell.coordinates, (x, y) => { shell.push([x, y]) }, reverse)
        result.push(shell)
        const { children } = this
        for(const child of children){
            child.ringsToGeoJson(!reverse, result)
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
    generalize(tolerance: Tolerance): Geometry {
        let shell: Geometry = this.shell
        if (shell.getBounds().isCollapsible(tolerance)){
            return this.getCentroid()
        }
        shell = shell.generalize(tolerance)
        if(!(shell instanceof LinearRing)){
            return shell
        }
        const { children } = this
        if (!children.length){
            return Polygon.unsafeValueOf(shell)
        }
        const walker = MeshPathWalker.valueOf(tolerance)
        shell.walkPath(walker)
        for (const child of children){
            child.generalize(tolerance).walkPath(walker)
        }
        const polygons = createPolygons(walker.rings)
        if (polygons.length == 1){
            return polygons[0]
        }
        return MultiGeometry.unsafeValueOf(undefined, undefined, polygons)
    }
    protected transformRings(transformer: Transformer, tolerance: Tolerance, result: Geometry[]) {
        result.push(this.shell.transform(transformer, tolerance))
        for(const child of this.children){
            child.transformRings(transformer, tolerance, result)
        }
    }
    transform(transformer: Transformer, tolerance: Tolerance): Geometry {
        const rings = []
        this.transformRings(transformer, tolerance, rings)
        const polygons = Polygon.valueOf(rings, tolerance)
        if (polygons.length === 1) {
            return polygons[0]
        }
        return MultiGeometry.unsafeValueOf(undefined, undefined, polygons)
    }
    relatePoint(x: number, y: number, tolerance: Tolerance): Relation {
        const relation = this.shell.relatePoint(x, y, tolerance)
        if (relation !== B_INSIDE_A){
            return relation
        }
        for (const child of this.children){
            const childRelation = child.relatePoint(x, y, tolerance)
            if (childRelation === TOUCH) {
                return TOUCH
            }
            if (childRelation == B_INSIDE_A){
                return B_OUTSIDE_A  // inside a hole is outside!
            }
        }
        return relation
    }
    protected lessGeometry(other: Geometry, tolerance: Tolerance): Geometry {
        if (
            (other instanceof Point) || 
            (other instanceof LineSegment) ||
            (other instanceof LineString) ||
            (other instanceof MultiGeometry && !other.polygons.length)
        ) {
            return this
        }
        return super.lessGeometry(other, tolerance)
    }
}


export function createPolygons(mesh: Mesh): Polygon[] {
    const rings = createLinearRings(mesh)
    const builders = []
    const { tolerance } = mesh
    for(const ring of rings){
        addRing(ring, tolerance, builders)
    }
    return builders.map(buildPolygon)
}


function addRing(ring: LinearRing, tolerance: Tolerance, builders: PolygonBuilder[]) {
    for(const builder of builders){
        const relation = ring.relate(builder.shell, tolerance)
        if(relation & A_INSIDE_B){
            addRing(ring, tolerance, builder.holes)
            return
        } else if(relation & B_INSIDE_A){
            const hole = {
                shell: builder.shell,
                holes: builder.holes
            }
            builder.shell = ring
            builder.holes = [hole]
            return
        }
    }
    builders.push({
        shell: ring,
        holes: []
    })
}


function buildPolygon(builder: PolygonBuilder){
    const children = builder.holes.map(h => buildPolygon(h))
    return Polygon.unsafeValueOf(
        builder.shell,
        children.length ? children : undefined
    )
}
