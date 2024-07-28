import { Node } from '../core/Node.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

class ConvertNode extends Node {
  static type = 'ConvertNode';

  constructor(node, convertTo) {
    super();

    this.node = node;
    this.convertTo = convertTo;
  }

  getNodeType(builder) {
    const requestType = this.node.getNodeType(builder);

    let convertTo = null;

    for (const overloadingType of this.convertTo.split('|')) {
      if (convertTo === null || TypeName.size(requestType) === TypeName.size(overloadingType)) {
        convertTo = overloadingType;
      }
    }

    return convertTo;
  }

  generate(builder, output) {
    const node = this.node;
    const type = this.getNodeType(builder);

    const snippet = node.build(builder, type);

    return builder.format(snippet, type, output);
  }
}

export default ConvertNode;
