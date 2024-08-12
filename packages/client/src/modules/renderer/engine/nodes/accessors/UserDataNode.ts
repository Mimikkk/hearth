import { ReferenceNode } from './ReferenceNode.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import NodeFrame from '@modules/renderer/engine/nodes/core/NodeFrame.js';

export class UserDataNode extends ReferenceNode {
  constructor(
    property: string,
    inputType: TypeName,
    public extra?: any,
  ) {
    super(property, inputType, extra);
  }

  update(frame: NodeFrame): void {
    this.reference = this.extra ?? frame.object.extra;
    super.update(frame);
  }
}

export const extra = (name: string, inputType: TypeName, extra: any) => new UserDataNode(name, inputType, extra);
