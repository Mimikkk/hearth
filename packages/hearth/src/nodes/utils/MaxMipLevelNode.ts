import { UniformNode } from '../core/UniformNode.js';
import { NodeUpdateStage } from '../core/constants.js';
import { asCommand } from '../shadernode/ShaderNode.primitves.js';
import { TextureNode } from '../../nodes/accessors/TextureNode.js';
import { TypeName } from '../../nodes/builder/NodeBuilder.types.js';

export class MaxMipLevelNode extends UniformNode {
  constructor(public textureNode: TextureNode) {
    super(0, TypeName.i32);
    this.stage = NodeUpdateStage.Frame;
  }

  get texture() {
    return this.textureNode.value;
  }

  update() {
    const texture = this.texture;
    const images = texture.images;
    const image = images && images.length > 0 ? (images[0] && images[0].image) || images[0] : texture.image;

    if (image && image.width !== undefined) {
      const { width, height } = image;

      this.value = Math.log2(Math.max(width, height));
    }
  }
}

export const maxMipLevel = asCommand(MaxMipLevelNode);
