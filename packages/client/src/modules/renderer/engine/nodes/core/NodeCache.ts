export class NodeCache {
  constructor(public map: WeakMap<Node, any> = new WeakMap()) {}

  get<T>(node: Node): T {
    return this.map.get(node);
  }

  set(node: Node, data: any): this {
    this.map.set(node, data);
    return this;
  }
}
