import ReferenceNode from './ReferenceNode.js';
import { asNode } from '../shadernode/ShaderNodes.js';

class UserDataNode extends ReferenceNode {
  static type = 'UserDataNode';

  constructor(property, inputType, userData = null) {
    super(property, inputType, userData);

    this.userData = userData;
  }

  update(frame) {
    this.reference = this.userData !== null ? this.userData : frame.object.userData;

    super.update(frame);
  }
}

export default UserDataNode;

export const userData = (name, inputType, userData) => asNode(new UserDataNode(name, inputType, userData));
