import { ReferenceNode } from './ReferenceNode.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import NodeFrame from '@modules/renderer/engine/nodes/core/NodeFrame.js';

export class UserDataNode extends ReferenceNode {
  constructor(property: string, inputType: TypeName, userData: any = null) {
    super(property, inputType, userData);
    this.userData = userData;
  }

  update(frame: NodeFrame) {
    this.reference = this.userData !== null ? this.userData : frame.object.userData;

    super.update(frame);
  }
}

export const userData = (name, inputType, userData) => new UserDataNode(name, inputType, userData);
