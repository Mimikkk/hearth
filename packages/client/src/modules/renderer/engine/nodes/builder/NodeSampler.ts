import Sampler from '../../renderers/Sampler.js';
import TextureNode from '@modules/renderer/engine/nodes/accessors/TextureNode.js';

class NodeSampler extends Sampler {
  textureNode: TextureNode;

  constructor(name: string, textureNode: TextureNode) {
    super(name, textureNode ? textureNode.value : null);

    this.textureNode = textureNode;
  }
}

export default NodeSampler;
