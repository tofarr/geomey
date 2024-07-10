import { PointBuilder } from "./PointBuilder";

// export type CoordinateVisitor = (x: number, y: number) => boolean

export type PointVisitor = (point: PointBuilder) => boolean | void

