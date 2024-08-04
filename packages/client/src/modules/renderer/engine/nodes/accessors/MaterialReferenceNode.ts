import { ReferenceNode } from './ReferenceNode.js';
import { asNode } from '../shadernode/ShaderNodes.js';

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



export const materialReference = (name, type, material) => asNode(new MaterialReferenceNode(name, type, material));
