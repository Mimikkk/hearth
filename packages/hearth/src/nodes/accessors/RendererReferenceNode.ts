import { ReferenceNode } from './ReferenceNode.js';
import { asCommand } from '../../nodes/shadernode/ShaderNode.as.js';
import NodeFrame from '../../nodes/core/NodeFrame.js';
import { TypeName } from '../../nodes/builder/NodeBuilder.types.js';
import { Hearth } from '../../hearth/Hearth.js';

export class RendererReferenceNode extends ReferenceNode {
  constructor(
    property: string,
    inputType: TypeName,
    public hearth?: Hearth,
  ) {
    super(property, inputType, hearth);
  }

  updateReference(state: NodeFrame) {
    this.reference = this.hearth ?? state.hearth;

    return this.reference;
  }
}

export const rendererRef = asCommand(RendererReferenceNode);
