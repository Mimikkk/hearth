import { ReferenceNode } from './ReferenceNode.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import NodeFrame from '@modules/renderer/engine/nodes/core/NodeFrame.js';

export class UserDataNode extends ReferenceNode {
  constructor(
    property: string,
    inputType: TypeName,
    public userData?: any,
  ) {
    super(property, inputType, userData);
  }

  update(frame: NodeFrame): void {
    this.reference = this.userData ?? frame.object.userData;
    super.update(frame);
  }
}

export const userData = (name: string, inputType: TypeName, userData: any) =>
  new UserDataNode(name, inputType, userData);
