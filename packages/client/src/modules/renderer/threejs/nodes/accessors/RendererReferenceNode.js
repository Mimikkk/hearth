import ReferenceNode from './ReferenceNode.js';
import { nodeObject } from '../shadernode/ShaderNodes.js';

class RendererReferenceNode extends ReferenceNode {
  static type = 'RendererReferenceNode';

  constructor(property, inputType, renderer = null) {
    super(property, inputType, renderer);

    this.renderer = renderer;
  }

  setReference(state) {
    this.reference = this.renderer !== null ? this.renderer : state.renderer;

    return this.reference;
  }
}

export default RendererReferenceNode;

export const rendererReference = (name, type, renderer) => nodeObject(new RendererReferenceNode(name, type, renderer));
