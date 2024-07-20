import TextureNode from '../accessors/TextureNode.js';
import { NodeUpdateType } from '../core/constants.js';
import { addNodeElement, nodeProxy } from '../shadernode/ShaderNodes.js';
import { viewportTopLeft } from './ViewportNode.js';
import { Filter, FramebufferTexture, Vector2 } from '@modules/renderer/engine/engine.js';

const _size = new Vector2();

class ViewportTextureNode extends TextureNode {
  static type = 'ViewportTextureNode';

  constructor(uvNode = viewportTopLeft, levelNode = null, framebufferTexture = null) {
    if (framebufferTexture === null) {
      framebufferTexture = new FramebufferTexture();
      framebufferTexture.minFilter = Filter.LinearMipmapLinear;
    }

    super(framebufferTexture, uvNode, levelNode);

    this.generateMipmaps = false;

    this.isOutputTextureNode = true;

    this.updateBeforeType = NodeUpdateType.FRAME;
  }

  updateBefore(frame) {
    const renderer = frame.renderer;
    renderer.getDrawingBufferSize(_size);

    //

    const framebufferTexture = this.value;

    if (framebufferTexture.image.width !== _size.width || framebufferTexture.image.height !== _size.height) {
      framebufferTexture.image.width = _size.width;
      framebufferTexture.image.height = _size.height;
      framebufferTexture.needsUpdate = true;
    }

    //

    const currentGenerateMipmaps = framebufferTexture.generateMipmaps;
    framebufferTexture.generateMipmaps = this.generateMipmaps;

    renderer.copyFramebufferToTexture(framebufferTexture);

    framebufferTexture.generateMipmaps = currentGenerateMipmaps;
  }

  clone() {
    return new this.constructor(this.uvNode, this.levelNode, this.value);
  }
}

export default ViewportTextureNode;

export const viewportTexture = nodeProxy(ViewportTextureNode);
export const viewportMipTexture = nodeProxy(ViewportTextureNode, null, null, { generateMipmaps: true });

addNodeElement('viewportTexture', viewportTexture);
addNodeElement('viewportMipTexture', viewportMipTexture);
