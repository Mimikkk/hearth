import { asCommand } from '../shadernode/ShaderNodes.js';
import { PropertyNode } from './PropertyNode.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

export class ParameterNode extends PropertyNode {
  constructor(nodeType: TypeName, name: string) {
    super(nodeType, name);
  }

  getHash(): string {
    return this.uuid;
  }

  generate(): string {
    return this.name;
  }
}

export const parameter = asCommand(ParameterNode);
