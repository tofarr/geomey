import { LinearRing } from "../LinearRing"
import { LineString } from "../LineString"
import { Mesh } from "../../mesh/Mesh"
import { MultiGeometry } from "../MultiGeometry"
import { A_INSIDE_B, B_INSIDE_A } from "../../Relation"
import { Tolerance } from "../../Tolerance"
import { Polygon } from "../Polygon"


export function createMultiGeometry(rings: Mesh, linesAndPoints: Mesh): MultiGeometry {
    return MultiGeometry.unsafeValueOf(
        createPoints(linesAndPoints),
        createLineStrings(linesAndPoints),
        createPolygons(rings)
    )
}


export function createPoints(mesh: Mesh): number[] {
    const coordinates = []
    mesh.forEachVertex((vertex) => {
        if (!vertex.links) {
            coordinates.push(vertex.x, vertex.y)
        }
    })
    return coordinates
}


export function createLineStrings(mesh: Mesh): LineString[] {
    const results = []
    mesh.forEachLineString((coordinates) => {
        results.push(LineString.unsafeValueOf(coordinates))
    })
    return results
}


export function createLinearRings(mesh: Mesh): LinearRing[] {
    const results = []
    mesh.forEachLinearRing((coordinates) => {
        results.push(LinearRing.unsafeValueOf(coordinates))
    })
    return results
}


interface PolygonBuilder {
    shell: LinearRing
    holes: PolygonBuilder[]
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
