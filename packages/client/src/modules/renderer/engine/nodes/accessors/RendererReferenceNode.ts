import { ReferenceNode } from './ReferenceNode.js';
import { asCommand } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.as.js';
import NodeFrame from '@modules/renderer/engine/nodes/core/NodeFrame.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';

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

export const rendererReference = asCommand(RendererReferenceNode);
