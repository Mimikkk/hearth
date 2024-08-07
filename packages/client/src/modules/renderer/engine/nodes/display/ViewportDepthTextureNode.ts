import { ViewportTextureNode } from './ViewportTextureNode.js';
import { asCommand } from '../shadernode/ShaderNode.primitves.ts';
import { viewportTopLeft } from './ViewportNode.js';
import { implCommand } from '@modules/renderer/engine/nodes/core/Node.commands.js';
import { DepthTexture } from '@modules/renderer/engine/entities/textures/DepthTexture.js';

let sharedDepthbuffer = null;

export class ViewportDepthTextureNode extends ViewportTextureNode {
  constructor(uvNode = viewportTopLeft, levelNode = null) {
    if (sharedDepthbuffer === null) {
      sharedDepthbuffer = new DepthTexture();
    }

    super(uvNode, levelNode, sharedDepthbuffer);
  }
}

export const viewportDepthTexture = asCommand(ViewportDepthTextureNode);

implCommand('viewportDepthTexture', ViewportDepthTextureNode);
