import { asCommand } from '../shadernode/ShaderNode.primitves.js';
import { PropertyNode } from './PropertyNode.js';
import { TypeName } from '../../nodes/builder/NodeBuilder.types.js';

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
