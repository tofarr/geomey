import { SpatialConsumer, SpatialIndex } from ".";
import { RectangleBuilder } from "../geom/builder/RectangleBuilder";
import { IRectangle, Rectangle } from "../geom";

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

  constructor(
    maxLeafSize?: number,
    leafBounds?: Rectangle[],
    leafValues?: T[],
  ) {
    this.root = {
      bounds: new RectangleBuilder(),
      leafBounds: leafBounds || [],
      leafValues: leafValues || [],
    };
    this.maxLeafSize = maxLeafSize || MAX_LEAF_SIZE;
    if (this.root.leafBounds.length > this.maxLeafSize) {
      this.splitLeaf(this.root);
    }
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
    const ab = a.bounds;
    const bb = b.bounds;
    let expandA = expansionSize(ab, rectangle);
    let expandB = expansionSize(bb, rectangle);
    if (expandA == expandB) {
      expandA = getArea(ab.minX, ab.minY, ab.maxX, ab.maxY);
      expandB = getArea(bb.minX, bb.minY, bb.maxX, bb.maxY);
    }
    return expandA < expandB ? a : b;
  }
  private splitLeaf(node: Node<T>) {
    const { bounds } = node;
    const { minX, minY, maxX, maxY } = bounds;
    const width = maxX - minX;
    const height = maxY - minY;
    let boundsA = null;
    let boundsB = null;
    if (width > height) {
      const split = (minX + maxX) / 2;
      boundsA = new RectangleBuilder(minX, minY, split, maxY);
      boundsB = new RectangleBuilder(split, minY, maxX, maxY);
    } else {
      const split = (minX + maxX) / 2;
      boundsA = new RectangleBuilder(minX, minY, split, maxY);
      boundsB = new RectangleBuilder(split, minY, maxX, maxY);
    }
    const a = {
      bounds: boundsA,
      leafBounds: [],
      leafValues: [],
    };
    const b = {
      bounds: boundsB,
      leafBounds: [],
      leafValues: [],
    };
    const { leafBounds, leafValues } = node;
    const { length } = leafBounds;
    for (let i = 0; i < length; i++) {
      const leafBound = leafBounds[i];
      const child = this.chooseBestMatch(leafBound, a, b);
      child.leafBounds.push(leafBound);
      child.leafValues.push(leafValues[i]);
    }
    if (a.leafBounds.length && b.leafBounds.length) {
      node.leafBounds = null;
      node.leafValues = null;
      this.recalculateBounds(a);
      this.recalculateBounds(b);
      node.a = a;
      node.b = b;
    }
  }
  private recalculateBounds(node: Node<T>) {
    const { bounds, leafBounds } = node;
    bounds.reset();
    for (const b of leafBounds) {
      bounds.unionRectangle(b);
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
    if (!node.bounds.intersectsRectangle(rectangle)) {
      return false;
    }
    const { a, b } = node;
    if (a) {
      const result =
        this.removeFromNode(a, rectangle, matcher) ||
        this.removeFromNode(b, rectangle, matcher);
      if (!result) {
        return result;
      }
      node.bounds.reset().unionRectangle(a.bounds).unionRectangle(b.bounds);
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
    const { leafBounds, leafValues } = node;
    for (let i = leafBounds.length; i-- > 0; ) {
      const leafBound = leafBounds[i];
      if (!leafBound.intersectsRectangle(rectangle)) {
        continue;
      }
      if (matcher(leafValues[i])) {
        leafBounds.splice(i, 1);
        leafValues.splice(i, 1);
        this.recalculateBounds(node);
        return true;
      }
    }
    return false;
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
      return true;
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
      const leafBound = leafBounds[i];
      if (!rectangle.intersectsRectangle(leafBound)) {
        continue;
      }
      if (consumer(leafValues[i], leafBound) === false) {
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
