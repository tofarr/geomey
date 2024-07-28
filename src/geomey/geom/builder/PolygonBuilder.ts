import { LinearRing } from "../LinearRing";

export interface PolygonBuilder {
  shell: LinearRing;
  holes: PolygonBuilder[];
}
