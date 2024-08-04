import { ReferenceNode } from './ReferenceNode.js';
import { asNode } from '../shadernode/ShaderNodes.js';

export class RendererReferenceNode extends ReferenceNode {
  constructor(property, inputType, hearth = null) {
    super(property, inputType, hearth);

    this.hearth = hearth;
  }

  updateReference(state) {
    this.reference = this.hearth !== null ? this.hearth : state.hearth;

    return this.reference;
  }
}



export const rendererReference = (name, type, hearth) => asNode(new RendererReferenceNode(name, type, hearth));
