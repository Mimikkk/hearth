import { Node } from './Node.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

export class StructTypeNode extends Node {
  constructor(public types: TypeName[]) {
    super();
  }
}
