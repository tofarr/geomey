import { forEachLineSegmentCoordinates } from "../coordinate";
import { Geometry } from "../geom/Geometry";
import { LinearRing } from "../geom/LinearRing";
import { LineString } from "../geom/LineString";
import { createMultiGeometry, MultiGeometry } from "../geom/MultiGeometry";
import { Point } from "../geom/Point"
import { createPolygons, Polygon } from "../geom/Polygon";
import { Mesh } from "../mesh/Mesh";
import { MeshPathWalker } from "../mesh/MeshPathWalker";
import { Tolerance, ZERO } from "../Tolerance";



export function parseWkt(input: string, tolerance: Tolerance = ZERO) {
    const typeParsers = tolerance.tolerance ? validatingTypeParsers : unsafeTypeParsers
    return doParseWkt(input, tolerance, 0, typeParsers)
}


export function doParseWkt(input: string, tolerance: Tolerance, position: number, typeParsers: TypeParsers){
    input = normalizeWkt(input);
    let [type, start] = parseType(input, position)
    return typeParsers[type](input, start+1, tolerance)
}


/**
 * Replace all commas with spaces, Make sure there is no duplicate whitespace, and
 * no leading or trialing whitespace before or after a brace.
 */
function normalizeWkt(input: string) {
    return (
        input
            .replaceAll(",", " ")
            .replace(/\s\s+/g, " ")
            .replaceAll("( ", "(")
            .replaceAll(" (", "(")
            .replaceAll(") ", ")")
            .replaceAll(" )", ")")
            .trim()
    )
}


function parseType(input: string, position: number): [string, number]{
    const newPosition = input.indexOf('(', position)
    return [input.substring(position, newPosition).toLowerCase(), newPosition]
}


function parseCoordinates(input: string, position: number): [number[], number] {
    const coordinates = []
    const end = input.indexOf(")")
    while(position < end){
        let next = input.indexOf(" ", position)
        if (next < 0 || next > end){
            next = end
        }
        coordinates.push(parseFloat(input.substring(position, next)))
        position = next + 1
    }
    return [coordinates, position]
}

interface TypeParsers {
    point(input: string, position: number): [Geometry, number]
    multipoint(input: string, position: number, tolerance: Tolerance): [Geometry, number]
    linestring(input: string, position: number): [Geometry, number]
    multilinestring(input: string, position: number, tolerance: Tolerance): [Geometry, number]
    polygon(input: string, position: number, tolerance: Tolerance): [Geometry, number]
    multipolygon(input: string, position: number, tolerance: Tolerance): [Geometry, number]
    multigeometry(input: string, position: number, tolerance: Tolerance): [Geometry, number]
}


const validatingTypeParsers: TypeParsers = {
    point(input: string, position: number): [Geometry, number] {
        let mid = input.indexOf(" ")
        const x = parseFloat(input.substring(position, mid).trim())
        mid++
        const end = input.indexOf(')', mid)
        const y = parseFloat(input.substring(mid, end).trim())
        return [Point.valueOf(x, y), end+1]
    },
    multipoint(input: string, position: number, tolerance: Tolerance): [Geometry, number] {
        const [coordinates, next] = parseCoordinates(input, position)
        return [MultiGeometry.valueOf(tolerance, coordinates), next]
    },
    linestring(input: string, position: number): [Geometry, number] {
        const [coordinates, next] = parseCoordinates(input, position)
        return [LineString.valueOf(coordinates), next]
    },
    multilinestring(input: string, position: number, tolerance: Tolerance): [Geometry, number] {
        const lineStrings = []
        while(input[position] == "("){
            const [coordinates, next] = parseCoordinates(input, position)
            lineStrings.push(LineString.valueOf(coordinates))
            position = next
        }
        return [MultiGeometry.valueOf(tolerance, undefined, lineStrings), position+1]
    },
    polygon(input: string, position: number, tolerance: Tolerance): [Geometry, number] {
        const mesh = new Mesh(tolerance)
        while(input[position] == "("){
            const [coordinates, next] = parseCoordinates(input, position)
            forEachLineSegmentCoordinates(coordinates, (ax, ay, bx, by) => {
                mesh.addLink(ax, ay, bx, by)
            })
            position = next
        }
        const polygons = createPolygons(mesh)
        const result = MultiGeometry.unsafeValueOf(undefined, undefined, polygons).simplify()
        return [result, position + 1]
    },
    multipolygon(input: string, position: number, tolerance: Tolerance): [Geometry, number] {
        const mesh = new Mesh(tolerance)
        while(input[position] == "("){
            position++
            while(input[position] == "("){
                const [coordinates, next] = parseCoordinates(input, position)
                forEachLineSegmentCoordinates(coordinates, (ax, ay, bx, by) => {
                    mesh.addLink(ax, ay, bx, by)
                })
                position = next
            }
        }
        const polygons = createPolygons(mesh)
        const result = MultiGeometry.unsafeValueOf(undefined, undefined, polygons).simplify()
        return [result, position + 1]
    },
    multigeometry(input: string, position: number, tolerance: Tolerance): [Geometry, number] {
        const walker = MeshPathWalker.valueOf(tolerance)
        while(input[position] != ")"){
            const [type, start] = parseType(input, position)
            const [geometry, end] = validatingTypeParsers[type](input, start+1, tolerance)
            geometry.walkPath(walker)
            position = end
        }
        return [createMultiGeometry(walker.rings, walker.linesAndPoints), position + 1]
    }
}


const unsafeTypeParsers: TypeParsers = {
    point(input: string, position: number): [Geometry, number] {
        let mid = input.indexOf(" ")
        const x = parseFloat(input.substring(position, mid).trim())
        mid++
        const end = input.indexOf(')', mid)
        const y = parseFloat(input.substring(mid, end).trim())
        return [Point.unsafeValueOf(x, y), end+1]
    },
    multipoint(input: string, position: number): [Geometry, number] {
        const [coordinates, next] = parseCoordinates(input, position)
        return [MultiGeometry.unsafeValueOf(coordinates), next]
    },
    linestring(input: string, position: number): [Geometry, number] {
        const [coordinates, next] = parseCoordinates(input, position)
        return [LineString.unsafeValueOf(coordinates), next]
    },
    multilinestring(input: string, position: number): [Geometry, number] {
        const lineStrings = []
        while(input[position] == "("){
            const [coordinates, next] = parseCoordinates(input, position)
            lineStrings.push(LineString.unsafeValueOf(coordinates))
            position = next
        }
        return [MultiGeometry.unsafeValueOf(undefined, lineStrings), position+1]
    },
    polygon(input: string, position: number): [Geometry, number] {
        const rings = []
        while(input[position] == "("){
            const [coordinates, next] = parseCoordinates(input, position)
            rings.push(LinearRing.unsafeValueOf(coordinates))
            position = next
        }
        const result = Polygon.unsafeValueOf(rings[0], rings.slice(1))
        return [result, position + 1]
    },
    multipolygon(input: string, position: number): [Geometry, number] {
        const polygons = []
        while(input[position] == "("){
            position++
            const polygon = unsafeTypeParsers.polygon(input, position, null)
            polygons.push(polygon)
        }
        const result = MultiGeometry.unsafeValueOf(undefined, undefined, polygons).simplify()
        return [result, position + 1]
    },
    multigeometry(input: string, position: number): [Geometry, number] {
        const coordinates = []
        const lineStrings = []
        const polygons = []
        while(input[position] != ")"){
            const [type, start] = parseType(input, position)
            const [geometry, end] = unsafeTypeParsers[type](input, start+1, null)
            if(geometry instanceof Point){
                coordinates.push(geometry.x, geometry.y)
            }else if(geometry instanceof LineString){
                lineStrings.push(geometry)
            }else if(geometry instanceof Polygon){
                polygons.push(geometry)
            }
            position = end
        }
        return [MultiGeometry.unsafeValueOf(coordinates, lineStrings, polygons), position + 1]
    }
}
