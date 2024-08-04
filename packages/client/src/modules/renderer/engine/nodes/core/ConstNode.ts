import { InputNode } from './InputNode.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

export class ConstNode<T = any> extends InputNode {
  declare isConstNode: boolean;
  constructor(value: T, nodeType: TypeName | null = null) {
    super(value, nodeType);

    this.isConstNode = true;
  }

  generateConst(builder: NodeBuilder) {
    return builder.codeConst(this.getNodeType(builder), this.value);
  }

  generate(builder, output) {
    const type = this.getNodeType(builder);

    return builder.format(this.generateConst(builder), type, output);
  }
}

ConstNode.prototype.isConstNode = true;


