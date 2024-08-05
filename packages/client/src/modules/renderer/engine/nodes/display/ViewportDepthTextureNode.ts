import { ViewportTextureNode } from './ViewportTextureNode.js';
import { proxyNode } from '../shadernode/ShaderNodes.js';
import { viewportTopLeft } from './ViewportNode.js';
import { DepthTexture } from '@modules/renderer/engine/engine.js';
import { implCommand } from '@modules/renderer/engine/nodes/core/Node.commands.js';

let sharedDepthbuffer = null;

export class ViewportDepthTextureNode extends ViewportTextureNode {
  constructor(uvNode = viewportTopLeft, levelNode = null) {
    if (sharedDepthbuffer === null) {
      sharedDepthbuffer = new DepthTexture();
    }

    super(uvNode, levelNode, sharedDepthbuffer);
  }
}

export const viewportDepthTexture = proxyNode(ViewportDepthTextureNode);

implCommand('viewportDepthTexture', ViewportDepthTextureNode);
