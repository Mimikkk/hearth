import TextureNode from '../accessors/TextureNode.js';
import { NodeUpdateType } from '../core/constants.js';
import { addNodeElement, nodeProxy } from '../shadernode/ShaderNodes.js';
import { viewportTopLeft } from './ViewportNode.js';
import { FramebufferTexture, MinificationTextureFilter, Vec2 } from '@modules/renderer/engine/engine.js';
import NodeFrame from '@modules/renderer/engine/nodes/core/NodeFrame.js';

const _size = Vec2.new();

class ViewportTextureNode extends TextureNode {
  static type = 'ViewportTextureNode';
  generateMipmaps: boolean;
  isOutputTextureNode: boolean;
  updateBeforeType: NodeUpdateType;

  constructor(uvNode = viewportTopLeft, levelNode = null, framebufferTexture: FramebufferTexture | null = null) {
    if (framebufferTexture === null) {
      framebufferTexture = new FramebufferTexture();
      framebufferTexture.minFilter = MinificationTextureFilter.LinearMipmapLinear;
    }

    super(framebufferTexture, uvNode, levelNode);

    this.generateMipmaps = false;
    this.isOutputTextureNode = true;
    this.updateBeforeType = NodeUpdateType.Frame;
  }

  updateBefore(frame: NodeFrame): void {
    const renderer = frame.renderer;
    renderer.getDrawSize(_size);
    ``;
    const framebufferTexture = this.value;
    if (framebufferTexture.image.width !== _size.width || framebufferTexture.image.height !== _size.height) {
      framebufferTexture.image.width = _size.width;
      framebufferTexture.image.height = _size.height;
      framebufferTexture.needsUpdate = true;
    }

    const currentGenerateMipmaps = framebufferTexture.generateMipmaps;
    framebufferTexture.generateMipmaps = this.generateMipmaps;

    renderer.readFramebuffer(framebufferTexture);

    framebufferTexture.generateMipmaps = currentGenerateMipmaps;
  }

  clone() {
    return new this.constructor(this.uvNode, this.levelNode, this.value);
  }
}

export default ViewportTextureNode;

export const viewportTexture = nodeProxy(ViewportTextureNode);
export const viewportMipTexture = nodeProxy(ViewportTextureNode);
viewportMipTexture.generateMipmaps = true;

addNodeElement('viewportTexture', viewportTexture);
addNodeElement('viewportMipTexture', viewportMipTexture);
