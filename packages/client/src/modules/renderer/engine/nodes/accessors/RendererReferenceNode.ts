import ReferenceNode from './ReferenceNode.js';
import { asNode } from '../shadernode/ShaderNodes.js';

class RendererReferenceNode extends ReferenceNode {
  static type = 'RendererReferenceNode';

  constructor(property, inputType, renderer = null) {
    super(property, inputType, renderer);

    this.renderer = renderer;
  }

  updateReference(state) {
    this.reference = this.renderer !== null ? this.renderer : state.renderer;

    return this.reference;
  }
}

export default RendererReferenceNode;

export const rendererReference = (name, type, renderer) => asNode(new RendererReferenceNode(name, type, renderer));
