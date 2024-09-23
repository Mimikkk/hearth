import { ReferenceNode } from './ReferenceNode.js';
import { asCommand } from '../../nodes/shadernode/ShaderNode.as.js';

export class MaterialReferenceNode extends ReferenceNode {
  constructor(property, inputType, material = null) {
    super(property, inputType, material);

    this.material = material;

    //this.stage = NodeUpdateType.RENDER;
  }

  updateReference(state) {
    this.reference = this.material !== null ? this.material : state.material;

    return this.reference;
  }
}

export const materialRef = asCommand(MaterialReferenceNode);
