import { TextureNode } from '../accessors/TextureNode.js';
import { NodeUpdateStage } from '../core/constants.js';
import { asCommand } from '../shadernode/ShaderNode.primitves.ts';
import { viewportTopLeft } from './ViewportNode.js';
import { NodeFrame } from '@modules/renderer/engine/nodes/core/NodeFrame.js';
import { implCommand } from '@modules/renderer/engine/nodes/core/Node.commands.js';
import { Vec2 } from '@modules/renderer/engine/math/Vec2.js';
import { FramebufferTexture } from '@modules/renderer/engine/entities/textures/FramebufferTexture.js';
import { GPUFilterModeType } from '@modules/renderer/engine/hearth/constants.js';

const _size = Vec2.new();

export class ViewportTextureNode extends TextureNode {
  useMipmap: boolean = false;
  updateBeforeType: NodeUpdateStage;

  constructor(
    uv: Node = viewportTopLeft,
    level: Node | null = null,
    framebuffer: FramebufferTexture = new FramebufferTexture({
      width: 1,
      height: 1,
      minFilter: GPUFilterModeType.Linear,
    }),
  ) {
    super(framebuffer, uv, level);

    this.updateBeforeType = NodeUpdateStage.Frame;
  }

  updateBefore(frame: NodeFrame): void {
    const hearth = frame.hearth;
    hearth.getDrawSize(_size);

    const texture = this.value;
    if (texture.image.width !== _size.width || texture.image.height !== _size.height) {
      texture.image.width = _size.width;
      texture.image.height = _size.height;

      texture.useUpdate = true;
    }

    const currentGenerateMipmaps = texture.useMipmap;
    texture.useMipmap = this.useMipmap;

    hearth.readFramebuffer(texture);

    texture.useMipmap = currentGenerateMipmaps;
  }
}

export class ViewportMipTextureNode extends ViewportTextureNode {
  useMipmap = true;
}

export const viewportTexture = asCommand(ViewportTextureNode);
export const viewportMipTexture = asCommand(ViewportMipTextureNode);

implCommand('viewportTexture', ViewportTextureNode);
implCommand('viewportMipTexture', ViewportTextureNode);
