import { comparePointsForSort, coordinateMatch, isNaNOrInfinite } from "../coordinate"
import { intersectionLineSegment, perpendicularDistance } from "../geom/LineSegment"
import { MultiGeometry } from "../geom/MultiGeometry"
import { Rectangle } from "../geom/Rectangle"
import { calculateZOrder, ZOrderIndex } from "../spatialIndex/ZOrderIndex"
import { Tolerance, ZERO } from "../Tolerance"
import { Link } from "./Link"
import { NetworkError } from "./NetworkError"
import { Vertex } from "./Vertex"


/**
 * Class describing a network of Vertices and Links, which may be used to build geometries.
 * Vertexes in a network are unique and rounded to the nearest tolerance, and links may not cross
 * each other outside of a vertex. (If they do, a vertex is added.)
 * 
 * Internally, Z order indexes are used to maintain performance. 
 */
export class Network {
    readonly tolerance: Tolerance
    private vertices: Map<number, Vertex>
    private links: ZOrderIndex<Link>

    constructor(tolerance: Tolerance) {
        this.tolerance = tolerance
        this.links = new ZOrderIndex<Link>(tolerance)
    }

    addVertex(x: number, y: number): Vertex {
        const tolerance = this.tolerance.tolerance
        
        // Normalize point...
        if(isNaNOrInfinite(x, y)){
            throw new NetworkError(`Invalid Vertex: ${x} ${y}`)
        }
        x = Math.round(x / tolerance) * tolerance
        y = Math.round(y / tolerance) * tolerance

        // Add vertex
        const zOrder = calculateZOrder(x, y, tolerance)
        let vertex =  this.vertices.get(zOrder)
        if (vertex) {
            return vertex  // already exists
        }
        vertex = new Vertex(x, y, zOrder)
        this.vertices.set(zOrder, vertex)

        // If the vertex lies on an existing link, break the link and add the vertex in the middle
        this.links.findIntersecting(Rectangle.unsafeValueOf(x, y, x, y), (link) => {
            if (perpendicularDistance(x, y, link.a.x, link.a.y, link.b.x, link.b.y) < tolerance) {
                this.removeLink(link.a.x, link.a.y, link.b.x, link.b.y)
                this.addLink(link.a.x, link.a.y, x, y)
                this.addLink(link.b.x, link.b.y, x, y)
                return false
            }
        })
    }
    /**
     * Add a link to the network. return the number of links actually added to the network.
     */
    addLink(ax: number, ay: number, bx: number, by: number): number {
        const { tolerance } = this
        const { tolerance: t } = tolerance

        // Normalize link...
        if (isNaNOrInfinite(ax, ay, bx, by)){
            throw new NetworkError(`Invalid Link: ${ax} ${ay} ${bx} ${by}`)
        }
        ax = Math.round(ax / t) * t
        ay = Math.round(ay / t) * t
        bx = Math.round(bx / t) * t
        by = Math.round(by / t) * t
        const compare = comparePointsForSort(ax, ay, bx, by);
        if (compare == 0) {
            // Can't link to self!
            throw new NetworkError(`Invalid Link: ${ax} ${ay} ${bx} ${by}`)
        } else if(compare > 0){
            [bx, by, ax, ay] = [ax, ay, bx, by]
        }

        // Check if link already exists
        const zOrder = calculateZOrder(ax, ay, t)
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
    clone() {
        const result = new Network(this.tolerance)
        this.vertices.forEach(vertex => result.addVertex(vertex.x, vertex.y))
        this.links.findAll(({a, b}) => { result.addLink(a.x, a.y, b.x, b.y) })
        return result
    }
    buildGeometry() {
        return this.clone().destructiveBuildGeometry()
    }
    destructiveBuildGeometry() {
        const points = []
        const lineStrings = []
        const rings = []
        
        const { vertices } = this

        // Find vertices with no links - these are points.
        //const { vertices } = this
        vertices.forEach((vertex, key) => {
            if(!vertex.links.length){
                points.push(vertex.x, vertex.y)
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
                lineStrings.push(lineString)
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
        return new MultiGeometry(coordinates, lineStrings, rings)
    }
}