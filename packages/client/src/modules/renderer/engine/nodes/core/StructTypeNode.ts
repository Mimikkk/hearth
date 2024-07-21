import Node from './Node.ts';
import { TypeName } from '@modules/renderer/engine/renderers/webgpu/nodes/NodeBuilder.types.js';

class StructTypeNode extends Node {
  static type = 'StructTypeNode';

  constructor(public types: TypeName[]) {
    super();
  }
}

export default StructTypeNode;
