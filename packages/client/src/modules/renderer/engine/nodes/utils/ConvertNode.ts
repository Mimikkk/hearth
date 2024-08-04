import { Node } from '../core/Node.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';

export class ConvertNode extends Node {
  constructor(
    public node: Node,
    public convertTo: TypeName,
  ) {
    super();
  }

  getNodeType(builder: NodeBuilder): TypeName {
    const requestType = this.node.getNodeType(builder);

    const types = this.convertTo.split('|') as TypeName[];

    let convertTo = types[0];
    for (let i = 1; i < types.length; i++) {
      if (TypeName.size(requestType) === TypeName.size(types[i])) {
        convertTo = types[i];
      }
    }

    return convertTo;
  }

  generate(builder: NodeBuilder, output: TypeName): string {
    const type = this.getNodeType(builder);

    const code = this.node.build(builder, type);

    return builder.format(code, type, output);
  }
}
