import { comparePointsForSort, coordinateMatch, coordinatesMatch, forEachCoordinate, forEachLineSegmentCoordinates, isNaNOrInfinite, sortCoordinates } from "../coordinate"
import { LinearRing } from "../geom/LinearRing"
import { intersectionLineSegment, perpendicularDistance, pointTouchesLineSegment, projectProgress } from "../geom/LineSegment"
import { douglasPeucker, LineString } from "../geom/LineString"
import { MultiGeometry } from "../geom/MultiGeometry"
import { Rectangle } from "../geom/Rectangle"
import { calculateZOrder, ZOrderIndex } from "../spatialIndex/ZOrderIndex"
import { Tolerance, ZERO } from "../Tolerance"
import { Link } from "./Link"
import { GeometryBuilderError } from "./GeometryBuilderError"
import { Vertex } from "./Vertex"
import { Polygon } from "../geom/Polygon"
import { DISJOINT } from "../Relation"
import { SpatialConsumer } from "../spatialIndex"

/*
Maybe rename this to multi-geometry builder.
Maybe we re-institute some of the builder classes.
Maybe we no longer need a toMultiGeometry class - we use this where applicable
Many operations become building up one of these

Maybe each geometry gets a relate to point method again that is used in builder
If something doesn't have linear rings and polygons does it need this?

The solution is not area and triangle nonsense, but to use GeometryBuilder responsibly!
*/

/**
 * Class describing a network of Vertices and Links, which may be used to build geometries.
 * Vertexes in a geometry builder are unique and rounded to the nearest tolerance, and links may not cross
 * each other outside of a vertex. (If they do, a vertex is added.)
 * 
 * Internally, Z order indexes are used to maintain performance. 
 */
export class GeometryBuilder {
    readonly tolerance: Tolerance
    private vertices: Map<number, Vertex>
    private links: ZOrderIndex<Link>

    constructor(tolerance: Tolerance) {
        this.tolerance = tolerance
        this.links = new ZOrderIndex<Link>(tolerance)
    }

    addVertex(x: number, y: number): Vertex {
        const { tolerance } = this
        
        // Normalize point...
        if(isNaNOrInfinite(x, y)){
            throw new GeometryBuilderError(`Invalid Vertex: ${x} ${y}`)
        }
        x = tolerance.normalize(x)
        y = tolerance.normalize(y)

        // Add vertex
        const zOrder = calculateZOrder(x, y, tolerance.tolerance)
        let vertex =  this.vertices.get(zOrder)
        if (vertex) {
            return vertex  // already exists
        }
        vertex = new Vertex(x, y, zOrder)
        this.vertices.set(zOrder, vertex)

        // If the vertex lies on an existing link, break the link and add the vertex in the middle
        this.links.findIntersecting(Rectangle.unsafeValueOf(x, y, x, y), ({a, b}) => {
            const { x: ax, y: ay} = a
            const { x: bx, y: by} = b
            if (pointTouchesLineSegment(x, y, ax, ay, bx, by, tolerance)) {
                this.removeLink(ax, ay, bx, by)
                this.addLink(ax, ay, x, y)
                this.addLink(bx, by, x, y)
                return false
            }
        })
    }
    getVertex(x: number, y: number): Vertex | null {
        const zOrder = calculateZOrder(x, y, this.tolerance.tolerance)
        return this.vertices.get(zOrder)
    }
    /**
     * Add a link to the geometrybuilder. return the number of links actually added to the geometrybuilder.
     */
    addLink(ax: number, ay: number, bx: number, by: number): number {
        const { tolerance } = this

        // Normalize link...
        if (isNaNOrInfinite(ax, ay, bx, by)){
            throw new GeometryBuilderError(`Invalid Link: ${ax} ${ay} ${bx} ${by}`)
        }
        ax = tolerance.normalize(ax)
        ay = tolerance.normalize(ay)
        bx = tolerance.normalize(bx)
        by = tolerance.normalize(by)
        const compare = comparePointsForSort(ax, ay, bx, by);
        if (compare == 0) {
            return 0  // Can't link to self!
        } else if(compare > 0){
            [bx, by, ax, ay] = [ax, ay, bx, by]
        }

        // Check if link already exists
        const zOrder = calculateZOrder(ax, ay, tolerance.tolerance)
        let vertex =  this.vertices.get(zOrder)
        if (vertex) {
            if (vertex.links.find(v => v.x === bx && v.y === by)) {
                return 0
            }
        }

        // Upsert the endpoints exist
        const a = this.addVertex(ax, ay)
        const b = this.addVertex(bx, by)

        // check if the link intersects any existing links
        const rectangle = Rectangle.valueOf([ax, ay, bx, by])
        let linksAdded = 0
        this.links.findIntersecting(rectangle, (link) => {
            const { x: jax, y: jay } = link.a
            const { x: jbx, y: jby } = link.b
            const intersection = intersectionLineSegment(ax, ay, bx, by, jax, jay, jbx, jby, tolerance)
            if (intersection) {
                const { x: ix, y: iy } = intersection
                if (!(coordinateMatch(jax, jay, ix, iy, ZERO) || coordinateMatch(jbx, jby, ix, iy, ZERO))) {
                    // The new link crosses an existing link - split it.
                    this.removeLink(jax, jay, jbx, jby)
                    this.addLink(jax, jay, ix, iy)
                    this.addLink(jbx, jby, ix, iy)
                }
                if (coordinateMatch(ax, ay, ix, iy, ZERO) || coordinateMatch(bx, by, ix, iy, ZERO)) {
                    // An intersection on an endpoint means the new link does not cross an existing link
                    return false  
                }
                linksAdded += this.addLink(ax, ay, ix, iy)
                linksAdded += this.addLink(bx, by, ix, iy)
            }
        })

        if (!linksAdded) {
            const aLinks = a.links as Vertex[]
            aLinks.push(b)
            aLinks.sort((u, v) => comparePointsForSort(u.x, u.y, v.x, v.y))
            const bLinks = b.links as Vertex[]
            bLinks.push(a)
            bLinks.sort((u, v) => comparePointsForSort(u.x, u.y, v.x, v.y))
            this.links.add(rectangle, { a, b })
            linksAdded++
        }

        return linksAdded
    }
    removeVertex(x: number, y: number): boolean {
        const tolerance = this.tolerance.tolerance

        if(isNaNOrInfinite(x, y)){
            return false  // Invalid point can't be removed
        }
        x = Math.round(x / tolerance) * tolerance
        y = Math.round(y / tolerance) * tolerance

        const zOrder = calculateZOrder(x, y, tolerance)
        let vertex =  this.vertices.get(zOrder)
        if (!vertex) {
            return false
        }
        for(const otherVertex of vertex.links){
            this.removeLink(x, y, otherVertex.x, otherVertex.y)
        }
        this.vertices.delete(zOrder)
        return true
    }
    removeLink(ax: number, ay: number, bx: number, by: number): boolean {
        const { tolerance } = this
        const { tolerance: t } = tolerance

        ax = Math.round(ax / t) * t
        ay = Math.round(ay / t) * t
        bx = Math.round(bx / t) * t
        by = Math.round(by / t) * t

        const zOrder = calculateZOrder(ax, ay, t)
        const a = this.vertices.get(zOrder)
        if (!a) {
            return false
        }
        const b = a.links.find(v => v.x == bx && v.y == by)
        if (!b) {
            return false
        }

        const rectangle = Rectangle.valueOf([ax, ay, bx, by])
        const { links } = this
        links.remove(rectangle, v => v.a === a && v.b === b)
        const aLinks = a.links as Vertex[]
        aLinks.splice(aLinks.indexOf(b), 1)
        const bLinks = b.links as Vertex[]
        bLinks.splice(bLinks.indexOf(a), 1)
        return true
    }
    forEachVertex(consumer: (vertex: Vertex) => boolean | void, rectangle?: Rectangle) {
        if (rectangle) {
            for(const vertex of this.vertices.values()){
                if (rectangle.relatePoint(vertex.x, vertex.y, this.tolerance) === DISJOINT) {
                    continue
                }
                if(consumer(vertex) === false){
                    return
                }
            }
        } else {
            for(const vertex of this.vertices.values()){
                if(consumer(vertex) === false){
                    return
                }
            }
        }
    }
    forEachLink(consumer: SpatialConsumer<Link>, rectangle?: Rectangle) {
        if (rectangle) {
            this.links.findIntersecting(rectangle, consumer)
        } else {
            this.links.findAll(consumer)
        }
    }
    cull(match: (x: number, y: number) => boolean) {
        this.cullLinks(match)
        this.cullVertices(match)
    }
    cullLinks(match: (x: number, y: number) => boolean) {
        const toRemove = []
        this.forEachLink(({a, b}) => {
            const { x: ax, y: ay} = a
            const { x: bx, y: by} = b
            const x = (ax + bx) / 2
            const y = (ay + by) / 2
            if (match(x, y)){
                toRemove.push(ax, ay, bx, by)
            }
        })
        const { length } = toRemove
        let i = 0
        while (i < length) {
            this.removeLink(toRemove[i++], toRemove[i++], toRemove[i++], toRemove[i++])
        }
    }
    cullVertices(match: (x: number, y: number) => boolean) {
        const toRemove = []
        this.forEachVertex(({x, y}) => {
            if (match(x, y)){
                toRemove.push(x, y)
            }
        })
        const { length } = toRemove
        let i = 0
        while (i < length) {
            this.removeVertex(toRemove[i++], toRemove[i++])
        }
    }
    clone() {
        const result = new GeometryBuilder(this.tolerance)
        this.vertices.forEach(vertex => result.addVertex(vertex.x, vertex.y))
        this.links.findAll(({a, b}) => { result.addLink(a.x, a.y, b.x, b.y) })
        return result
    }
    clearAndBuildTriangles(): number[]{
        this.cullVertices((x: number, y: number) => )
    }
    buildGeometry() {
        return this.clone().clearAndBuilderGeometry()
    }
    clearAndBuilderGeometry() {
        const pointCoordinates = []
        const lineStringCoordinates = []
        const ringCoordinates = []
        
        const { vertices } = this

        // Find vertices with no links - these are points.
        vertices.forEach((vertex, key) => {
            if(!vertex.links.length){
                pointCoordinates.push(vertex.x, vertex.y)
                vertices.delete(key)
            }
        })

        while(vertices.size) {
            // Find vertices that have only 1 link - follow these (removing links as we go)
            // until we hit a vertex that does not have 1 outgoing link. That's a line string!
            vertices.forEach((vertex) => {
                if(vertex.links.length !== 1){
                    return
                }
                let prev = vertex
                const lineString = [vertex.x, vertex.y]
                lineStringCoordinates.push(lineString)
                vertex = vertex.links[0]
                while (true) {
                    this.removeVertex(prev.x, prev.y)
                    lineString.push(vertex.x, vertex.y)
                    const { links } = vertex
                    const { length } = links
                    if(length !== 1){
                        if(!links){
                            this.removeVertex(vertex.x, vertex.y)
                        }
                        break
                    }
                    const next = links[0]
                    prev = vertex
                    vertex = next
                    continue
                }
            })

            if(!vertices.size) {
                continue
            }

            // Start with the lowest z index. Follow it always taking the rightmost path ( So we are going anti-clockwise), 
            // removing links as we go. When we get back to the origin, we have a ring!
            let origin = undefined
            for (const vertex of vertices.values()) {
                if (!origin || comparePointsForSort(vertex.x, vertex.y, origin.x, origin.y) < 0){
                    origin = vertex
                }
            }

            const ring = [origin.x, origin.y]
            let current = origin
            let prev = new Vertex(current.x, current.y - this.tolerance.tolerance * 2, undefined)
            while(true){
                const next = current.nextAnticlockwiseVertexFrom(prev)
                this.removeLink(current.x, current.y, next.x, next.y)
                if (!current.links.length ){
                    this.removeVertex(current.x, current.y)
                }
                if (next == origin){
                    break
                }
                ring.push(next.x, next.y)
            }
        }
        sortCoordinates(pointCoordinates)
        const lineStrings = lineStringCoordinates.map(coordinates => LineString.unsafeValueOf(coordinates))
        const rings = ringCoordinates.map(coordinates => LinearRing.unsafeValueOf(coordinates))
        return new MultiGeometry(coordinates, lineStrings, rings)
    }
    getVerticesByZ() {
        const { tolerance: t } = this.tolerance
        const result = Array.from(this.vertices.values())
        result.sort((a, b) => {
            const az = calculateZOrder(a.x, a.y, t)
            const bz = calculateZOrder(b.x, b.y, t)
            return az - bz
        })
        return result
    }
    createSnapped(snapTolerance: Tolerance): GeometryBuilder {
        const vertices = this.getVerticesByZ()
        const result = new GeometryBuilder(this.tolerance)
        const snapGroups = createSnapGroups(vertices, snapTolerance)
        const snapMappings = createSnapMappings(snapGroups, result)
        createSnappedLinks(this.links, snapMappings, result)
        return result
    }
    createGeneralized(tolerance: Tolerance): GeometryBuilder {
        const result = this.createSnapped(tolerance)
        const lineStrings = getLineStrings(result.vertices)
        for (const lineString of lineStrings){
            const generalized = douglasPeucker(lineString, tolerance.tolerance)
            if (lineString.length === generalized.length){
                continue
            }
            forEachCoordinate(lineString, (x, y) => { result.removeVertex(x, y) }, 1, lineString.length >> 1 - 1)
            forEachLineSegmentCoordinates(generalized, (ax, ay, bx, by) => {
                result.addLink(ax, ay, bx, by)
            })
        }
        return result
    }
}


/**
 * Get line stringsfrom the vertices given. Line strings begin / terminate at vertices which
 * do not have 2 links
 */
export function getLineStrings(vertices: Map<number, Vertex>): number[][]{
    const result = []
    for(const vertex of vertices.values()){
        const { links } = vertex
        if (links.length == 2){
            continue
        }
        const { x, y } = vertex
        for (const link of links){
            const { x: lx, y: ly } = link
            if(comparePointsForSort(x, y, lx, ly) < 0){
                const lineString = getLineString(vertex, link)
                result.push(lineString)
            }
        }
    }
    return result
}


/**
 * Follow the path of a linestring until we hit a vertex that is not connected to 2 other vertices
 */
export function getLineString(prev: Vertex, current: Vertex): number[] {
    const lineString = [prev.x, prev.y, current.x, current.y]
    while(current.links.length == 2){
        const next = current[current.links[0] == prev ? 1 : 0]
        lineString.push(next.x, next.y)
        prev = current
        current = next
    }
    return lineString
}


export function createSnapGroups(vertices: Vertex[], snapTolerance: Tolerance): Vertex[][]{
    const result = []
    let { length } = vertices
    let a = 0
    while(a < length){
        const { x: ax, y: ay } = vertices[a]
        let b = a
        while(++b < length){
            const { x: bx, y: by } = vertices[b]    
            if(!coordinateMatch(ax, ay, bx, by, snapTolerance)) {
                break
            }
        }
        const snapSize = b - a
        result.push(vertices.slice(a, b))
    }
    return result
}


export function createSnapMappings(snapGroups: Vertex[][], result: GeometryBuilder) {
    const snapMappings = new Map<number, Vertex>()
    for (const snapGroup of snapGroups){
        let x = 0
        let y = 0
        for (const vertex of snapGroup) {
            x += vertex.x
            y += vertex.y
        }
        x /= snapGroup.length
        y /= snapGroup.length
        const snapped = result.addVertex(x, y)
        for (const vertex of snapGroup) {
            snapMappings.set(vertex.zOrder, snapped)
        }
    }
    return snapMappings
}


export function createSnappedLinks(links: ZOrderIndex<Link>, snapMappings: Map<number, Vertex>, result: GeometryBuilder) {
    links.findAll((link) => {
        const a = snapMappings.get(link.a.zOrder)
        const b = snapMappings.get(link.b.zOrder)
        if (a !== b){
            result.addLink(a.x, a.y, b.x, b.y)
        }
    })
}
