import { LinearRing } from "../LinearRing";

export interface PolygonBuilder {
  shell: LinearRing;
  children: PolygonBuilder[];
}
