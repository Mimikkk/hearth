import { InputNode } from './InputNode.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { Node } from '@modules/renderer/engine/nodes/core/Node.js';

export class ConstNode<T = any> extends InputNode {
  constructor(value: T, type: TypeName = TypeName.ofValue(value)) {
    super(value, type);
  }

  generateConst(builder: NodeBuilder): string {
    return builder.codeConst(this.getNodeType(builder), this.value);
  }

  generate(builder: NodeBuilder, output: TypeName): string {
    const type = this.getNodeType(builder);

    return builder.format(this.generateConst(builder), type, output);
  }
}

export type NodeVal<T = any> = ConstNode<T> | Node | T;
