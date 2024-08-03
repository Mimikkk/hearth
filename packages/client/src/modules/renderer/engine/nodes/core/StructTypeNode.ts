import { Node } from './Node.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

class StructTypeNode extends Node {
  constructor(public types: TypeName[]) {
    super();
  }
}

export default StructTypeNode;
