import { Rectangle } from "../geom/Rectangle";

export type SpatialConsumer<T> = (value: T, rectangle: Rectangle) => any;

export interface SpatialIndex<T> {
  add: (rectangle: Rectangle, value: T) => void;
  remove: (rectangle: Rectangle, matcher: (value: T) => boolean) => boolean;
  findIntersecting: (
    rectangle: Rectangle,
    consumer: SpatialConsumer<T>,
  ) => void;
  findAll: (consumer: SpatialConsumer<T>) => void;
}
