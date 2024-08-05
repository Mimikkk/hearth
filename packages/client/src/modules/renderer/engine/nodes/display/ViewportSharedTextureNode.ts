import { ViewportTextureNode } from './ViewportTextureNode.js';
import { proxyNode } from '../shadernode/ShaderNodes.js';
import { viewportTopLeft } from './ViewportNode.js';
import { FramebufferTexture } from '@modules/renderer/engine/engine.js';
import { implCommand } from '@modules/renderer/engine/nodes/core/Node.commands.js';

let _sharedFramebuffer = null;

export class ViewportSharedTextureNode extends ViewportTextureNode {
  constructor(uvNode = viewportTopLeft, levelNode = null) {
    if (_sharedFramebuffer === null) {
      _sharedFramebuffer = new FramebufferTexture();
    }

    super(uvNode, levelNode, _sharedFramebuffer);
  }
}

export const viewportSharedTexture = proxyNode(ViewportSharedTextureNode);

implCommand('viewportSharedTexture', ViewportSharedTextureNode);
