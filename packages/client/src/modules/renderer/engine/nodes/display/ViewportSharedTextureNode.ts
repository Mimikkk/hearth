import { ViewportTextureNode } from './ViewportTextureNode.js';
import { asCommand } from '../shadernode/ShaderNode.primitves.ts';
import { viewportTopLeft } from './ViewportNode.js';
import { implCommand } from '@modules/renderer/engine/nodes/core/Node.commands.js';
import { FramebufferTexture } from '@modules/renderer/engine/entities/textures/FramebufferTexture.js';

let _sharedFramebuffer = null;

export class ViewportSharedTextureNode extends ViewportTextureNode {
  constructor(uvNode = viewportTopLeft, levelNode = null) {
    if (_sharedFramebuffer === null) {
      _sharedFramebuffer = new FramebufferTexture();
    }

    super(uvNode, levelNode, _sharedFramebuffer);
  }
}

export const viewportSharedTexture = asCommand(ViewportSharedTextureNode);

implCommand('viewportSharedTexture', ViewportSharedTextureNode);
