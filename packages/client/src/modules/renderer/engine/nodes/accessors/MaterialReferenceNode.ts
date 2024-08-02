import ReferenceNode from './ReferenceNode.js';
//import { renderGroup } from '../core/UniformGroupNode.js';
//import { NodeUpdateType } from '../core/constants.js';
import { asNode } from '../shadernode/ShaderNodes.js';

class MaterialReferenceNode extends ReferenceNode {
  static type = 'MaterialReferenceNode';

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

export default MaterialReferenceNode;

export const materialReference = (name, type, material) => asNode(new MaterialReferenceNode(name, type, material));
