import UniformNode from '@modules/renderer/engine/nodes/core/UniformNode.js';

export class NodeUniform<T> {
  declare isNodeUniform: true;

  constructor(
    public name: string,
    public type: any,
    public node: UniformNode<T>,
    public needsUpdate?: boolean,
  ) {}

  get value() {
    return this.node.value;
  }

  set value(val: T) {
    this.node.value = val;
  }

  get id() {
    return this.node.id;
  }

  get groupNode() {
    return this.node.groupNode;
  }
}

NodeUniform.prototype.isNodeUniform = true;

export default NodeUniform;
