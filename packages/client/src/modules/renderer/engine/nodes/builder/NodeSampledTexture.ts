import { SampledTexture } from '../../renderers/bindings/SampledTexture.js';
import TextureNode from '@modules/renderer/engine/nodes/accessors/TextureNode.js';

export class NodeSampledTexture extends SampledTexture {
  textureNode: TextureNode;

  constructor(name: string, textureNode: TextureNode) {
    super(name, textureNode ? textureNode.value : null);

    this.textureNode = textureNode;
  }

  get needsBindingsUpdate() {
    return this.textureNode.value !== this.texture || super.needsBindingsUpdate;
  }

  update() {
    const { textureNode } = this;

    if (this.texture !== textureNode.value) {
      this.texture = textureNode.value;

      return true;
    }

    return super.update();
  }
}

export class NodeSampledCubeTexture extends NodeSampledTexture {
  declare isSampledCubeTexture: true;

  constructor(name: string, textureNode: TextureNode) {
    super(name, textureNode);
  }
}

NodeSampledCubeTexture.prototype.isSampledCubeTexture = true;
