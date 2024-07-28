import { SpatialConsumer, SpatialIndex } from ".";
import { RectangleBuilder } from "../geom/builder/RectangleBuilder";
import { IRectangle, Rectangle } from "../geom/Rectangle";

export interface Node<T> {
  bounds: RectangleBuilder;
  leafBounds?: Rectangle[];
  leafValues?: T[];
  a?: Node<T>;
  b?: Node<T>;
}

const MAX_LEAF_SIZE = 10;

export class RTree<T> implements SpatialIndex<T> {
  root: Node<T>;
  maxLeafSize: number;

  constructor(maxLeafSize?: number) {
    this.root = {
      bounds: new RectangleBuilder(),
      leafBounds: [],
      leafValues: [] as T[],
    };
    this.maxLeafSize = maxLeafSize || MAX_LEAF_SIZE;
  }
  add(rectangle: Rectangle, value: T) {
    this.addToNode(this.root, rectangle, value);
  }
  private addToNode(node: Node<T>, rectangle: Rectangle, value: T) {
    node.bounds.unionRectangle(rectangle);
    if (node.a) {
      const child = this.chooseBestMatch(rectangle, node.a, node.b);
      this.addToNode(child, rectangle, value);
    } else {
      node.leafBounds.push(rectangle);
      node.leafValues.push(value);
      if (node.leafBounds.length >= this.maxLeafSize) {
        this.splitLeaf(node);
      }
    }
  }
  private chooseBestMatch(
    rectangle: Rectangle,
    a: Node<T>,
    b: Node<T>,
  ): Node<T> {
    const expandA = expansionSize(a.bounds, rectangle);
    const expandB = expansionSize(b.bounds, rectangle);
    return expandA < expandB ? a : b;
  }
  private splitLeaf(node: Node<T>) {
    const splits = findMostDifferentBounds(node.leafBounds);
    const [boundsA, boundsB] = splits;
    node.a = {
      bounds: new RectangleBuilder().unionRectangle(boundsA),
      leafBounds: [],
      leafValues: [],
    };
    node.b = {
      bounds: new RectangleBuilder().unionRectangle(boundsB),
      leafBounds: [],
      leafValues: [],
    };
    const { leafBounds, leafValues } = node;
    node.leafBounds = null;
    node.leafValues = null;
    const { length } = leafBounds;
    for (let i = 0; i < length; i++) {
      this.addToNode(node, leafBounds[i], leafValues[i]);
    }
  }
  remove(rectangle: Rectangle, matcher: (value: T) => boolean): boolean {
    return this.removeFromNode(this.root, rectangle, matcher);
  }
  removeFromNode(
    node: Node<T>,
    rectangle: Rectangle,
    matcher: (value: T) => boolean,
  ): boolean {
    if (!node.bounds.containsRectangle(rectangle)) {
      return false;
    }
    const { a, b } = node;
    if (a) {
      const result =
        this.removeFromNode(a, rectangle, matcher) ||
        this.removeFromNode(b, rectangle, matcher);
      const aLeafBounds = a.leafBounds;
      const bLeafBounds = b.leafBounds;
      if (
        aLeafBounds &&
        bLeafBounds &&
        aLeafBounds.length + bLeafBounds.length <= this.maxLeafSize
      ) {
        node.leafBounds = aLeafBounds;
        aLeafBounds.push(...bLeafBounds);
        node.leafValues = a.leafValues;
        a.leafValues.push(...b.leafValues);
        node.a = node.b = null;
      }
      return result;
    }
  }
  findIntersecting(rectangle: Rectangle, consumer: SpatialConsumer<T>) {
    this.findIntersectingNode(this.root, rectangle, consumer);
  }
  private findIntersectingNode(
    node: Node<T>,
    rectangle: Rectangle,
    consumer: SpatialConsumer<T>,
  ): boolean {
    if (!node.bounds.intersectsRectangle(rectangle)) {
      return;
    }
    if (node.a) {
      return (
        this.findIntersectingNode(node.a, rectangle, consumer) &&
        this.findIntersectingNode(node.b, rectangle, consumer)
      );
    }
    const { leafBounds, leafValues } = node;
    const { length } = leafBounds;
    for (let i = 0; i < length; i++) {
      if (consumer(leafValues[i], leafBounds[i]) === false) {
        return false;
      }
    }
    return true;
  }
  findAll(consumer: SpatialConsumer<T>) {
    this.findAllNode(this.root, consumer);
  }
  private findAllNode(node: Node<T>, consumer: SpatialConsumer<T>): boolean {
    if (node.a) {
      return (
        this.findAllNode(node.a, consumer) && this.findAllNode(node.b, consumer)
      );
    }
    const { leafBounds, leafValues } = node;
    const { length } = leafBounds;
    for (let i = 0; i < length; i++) {
      if (consumer(leafValues[i], leafBounds[i]) === false) {
        return false;
      }
    }
    return true;
  }
}

function expansionSize(origin: IRectangle, expansion: IRectangle) {
  const { minX, minY, maxX, maxY } = origin;
  const eMinX = Math.min(minX, expansion.minX);
  const eMinY = Math.min(minY, expansion.minY);
  const eMaxX = Math.max(maxX, expansion.maxX);
  const eMaxY = Math.max(maxY, expansion.maxY);
  return getArea(eMinX, eMinY, eMaxX, eMaxY) - getArea(minX, minY, maxX, maxY);
}

function getArea(minX: number, minY: number, maxX: number, maxY: number) {
  return (maxX - minX) * (maxY - minY);
}

function findMostDifferentBounds(bounds: IRectangle[]) {
  bounds = bounds.slice();
  const last = bounds.length - 1;
  bounds.sort((a, b) => {
    return a.minX - b.minX || a.maxX - b.maxX;
  });
  let maxDiff = -Infinity;
  let a = null;
  let b = bounds[last];
  for (const c of bounds) {
    const diff = b.minX - c.maxX;
    if (diff > maxDiff) {
      a = c;
      maxDiff = diff;
    }
  }
  bounds.sort((a, b) => {
    return a.minY - b.minY || a.maxY - b.maxY;
  });
  const d = bounds[last];
  for (const c of bounds) {
    const diff = d.minX - c.maxX;
    if (diff > maxDiff) {
      a = c;
      b = d;
      maxDiff = diff;
    }
  }
  if (maxDiff > 0) {
    return [a, b];
  }
}
