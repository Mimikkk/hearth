import TextureNode from '../accessors/TextureNode.js';
import { NodeUpdateStage } from '../core/constants.js';
import { addNodeCommand, proxyNode } from '../shadernode/ShaderNodes.js';
import { viewportTopLeft } from './ViewportNode.js';
import { FramebufferTexture, MinificationTextureFilter, Vec2 } from '@modules/renderer/engine/engine.js';
import { NodeFrame } from '@modules/renderer/engine/nodes/core/NodeFrame.js';

const _size = Vec2.new();

class ViewportTextureNode extends TextureNode {
  generateMipmaps: boolean;
  isOutputTextureNode: boolean;
  updateBeforeType: NodeUpdateStage;

  constructor(uvNode = viewportTopLeft, levelNode = null, framebufferTexture: FramebufferTexture | null = null) {
    if (framebufferTexture === null) {
      framebufferTexture = new FramebufferTexture();
      framebufferTexture.minFilter = MinificationTextureFilter.LinearMipmapLinear;
    }

    super(framebufferTexture, uvNode, levelNode);

    this.generateMipmaps = false;
    this.isOutputTextureNode = true;
    this.updateBeforeType = NodeUpdateStage.Frame;
  }

  updateBefore(frame: NodeFrame): void {
    const hearth = frame.hearth;
    hearth.getDrawSize(_size);
    ``;
    const framebufferTexture = this.value;
    if (framebufferTexture.image.width !== _size.width || framebufferTexture.image.height !== _size.height) {
      framebufferTexture.image.width = _size.width;
      framebufferTexture.image.height = _size.height;
      framebufferTexture.needsUpdate = true;
    }

    const currentGenerateMipmaps = framebufferTexture.generateMipmaps;
    framebufferTexture.generateMipmaps = this.generateMipmaps;

    hearth.readFramebuffer(framebufferTexture);

    framebufferTexture.generateMipmaps = currentGenerateMipmaps;
  }

  clone() {
    return new this.constructor(this.uvNode, this.levelNode, this.value);
  }
}

export default ViewportTextureNode;

export const viewportTexture = proxyNode(ViewportTextureNode);
export const viewportMipTexture = proxyNode(ViewportTextureNode);
viewportMipTexture.generateMipmaps = true;

addNodeCommand('viewportTexture', viewportTexture);
addNodeCommand('viewportMipTexture', viewportMipTexture);
