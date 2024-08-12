import { TextureNode } from '../accessors/TextureNode.js';
import { NodeUpdateStage } from '../core/constants.js';
import { asCommand } from '../shadernode/ShaderNode.primitves.ts';
import { viewportTopLeft } from './ViewportNode.js';
import { NodeFrame } from '@modules/renderer/engine/nodes/core/NodeFrame.js';
import { implCommand } from '@modules/renderer/engine/nodes/core/Node.commands.js';
import { Vec2 } from '@modules/renderer/engine/math/Vec2.js';
import { FramebufferTexture } from '@modules/renderer/engine/entities/textures/FramebufferTexture.js';
import { MinificationTextureFilter } from '@modules/renderer/engine/constants.js';

const _size = Vec2.new();

export class ViewportTextureNode extends TextureNode {
  generateMipmaps: boolean = false;
  isOutputTextureNode: boolean;
  updateBeforeType: NodeUpdateStage;

  constructor(
    uvNode = viewportTopLeft,
    levelNode: Node | null = null,
    framebufferTexture: FramebufferTexture | null = null,
  ) {
    if (framebufferTexture === null) {
      framebufferTexture = new FramebufferTexture({ width: 1, height: 1 });
      framebufferTexture.minFilter = MinificationTextureFilter.LinearMipmapLinear;
    }

    super(framebufferTexture, uvNode, levelNode);

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
}

export const viewportTexture = asCommand(ViewportTextureNode);

export class ViewportMipTextureNode extends ViewportTextureNode {
  generateMipmaps = true;
}

export const viewportMipTexture = asCommand(ViewportMipTextureNode);

implCommand('viewportTexture', ViewportTextureNode);
implCommand('viewportMipTexture', ViewportTextureNode);
