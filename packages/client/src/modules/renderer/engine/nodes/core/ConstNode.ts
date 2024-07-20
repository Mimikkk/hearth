import InputNode from './InputNode.js';
import { NodeType } from '@modules/renderer/engine/nodes/core/constants.js';
import { NodeBuilder } from '@modules/renderer/engine/renderers/webgpu/nodes/NodeBuilder.js';

export class ConstNode<T = any> extends InputNode {
  declare isConstNode: boolean;
  static type = 'ConstNode';

  constructor(value: T, nodeType: NodeType | null = null) {
    super(value, nodeType);

    this.isConstNode = true;
  }

  generateConst(builder: NodeBuilder) {
    return builder.generateConst(this.getNodeType(builder), this.value);
  }

  generate(builder, output) {
    const type = this.getNodeType(builder);

    return builder.format(this.generateConst(builder), type, output);
  }
}

ConstNode.prototype.isConstNode = true;

export default ConstNode;
