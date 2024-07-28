import UniformNode from '@modules/renderer/engine/nodes/core/UniformNode.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

export class Uniform<T> {
  declare isNodeUniform: true;

  constructor(
    public name: string,
    public type: TypeName,
    public node: UniformNode<T>,
  ) {}

  static is(value: any): value is Uniform<any> {
    return value?.isNodeUniform;
  }

  get value() {
    return this.node.value;
  }

  set value(value: T) {
    this.node.value = value;
  }

  get id() {
    return this.node.id;
  }

  get groupNode() {
    return this.node.groupNode;
  }
}

Uniform.prototype.isNodeUniform = true;

export default Uniform;
