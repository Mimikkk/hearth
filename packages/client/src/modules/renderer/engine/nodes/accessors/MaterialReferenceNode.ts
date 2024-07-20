import ReferenceNode from './ReferenceNode.js';
//import { renderGroup } from '../core/UniformGroupNode.js';
//import { NodeUpdateType } from '../core/constants.js';
import { nodeObject } from '../shadernode/ShaderNodes.js';

class MaterialReferenceNode extends ReferenceNode {
  static type = 'MaterialReferenceNode';

  constructor(property, inputType, material = null) {
    super(property, inputType, material);

    this.material = material;

    //this.updateType = NodeUpdateType.RENDER;
  }

  setReference(state) {
    this.reference = this.material !== null ? this.material : state.material;

    return this.reference;
  }
}

export default MaterialReferenceNode;

export const materialReference = (name, type, material) => nodeObject(new MaterialReferenceNode(name, type, material));
