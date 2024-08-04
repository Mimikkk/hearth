import { ReferenceNode } from './ReferenceNode.js';
import { asNode } from '../shadernode/ShaderNodes.js';

export class UserDataNode extends ReferenceNode {
  constructor(property, inputType, userData = null) {
    super(property, inputType, userData);

    this.userData = userData;
  }

  update(frame) {
    this.reference = this.userData !== null ? this.userData : frame.object.userData;

    super.update(frame);
  }
}



export const userData = (name, inputType, userData) => asNode(new UserDataNode(name, inputType, userData));
