import { Geometry } from "./Geometry";
import { LineString } from "./LineString";
import { MultiPoint } from "./MultiPoint";
import { Polygon } from "./Polygon";
import { Rectangle, RectangleBuilder } from "./Rectangle";


export class MultiGeometry implements Geometry {
    readonly points?: MultiPoint
    readonly lineStrings?: ReadonlyArray<LineString>
    readonly polygons?: ReadonlyArray<Polygon>
    bounds?: Rectangle
    area?: number

    constructor(points: MultiPoint | null, lineStrings?: ReadonlyArray<LineString>, polygons?: ReadonlyArray<Polygon>){
        this.points = points || undefined
        this.lineStrings = lineStrings || undefined
        this.polygons = polygons || undefined
    }

    normalize(): MultiPolygon | Polygon {
        if (this.polygons.length == 1){
            return this.polygons[0]
        }
        return new MultiPolygon(
            this.polygons.sort((a, b) => a.getBounds().compare(b.getBounds()))
        )
    }

    getBounds() {
        let bounds = this.bounds
        if (!bounds) {
            const builder = new RectangleBuilder()
            for(const polygon of this.polygons) {
                builder.unionRectangle(polygon.getBounds())
            }
            bounds = this.bounds = builder.build()
        }
        return bounds
    }

    getArea() {
        const { area } = this
        if (area == null) {
            this.polygons.reduce((area, polygon) => {
                return area + polygon.getArea()
            }, 0)
        }
        return area
    }
}