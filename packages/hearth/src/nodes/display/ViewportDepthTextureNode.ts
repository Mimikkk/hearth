import { ViewportTextureNode } from './ViewportTextureNode.js';
import { asCommand } from '../shadernode/ShaderNode.primitves.js';
import { viewportTopLeft } from './ViewportNode.js';
import { implCommand } from '../../nodes/core/Node.commands.js';
import { DepthTexture } from '../../entities/textures/DepthTexture.js';
import { Node } from '../../nodes/core/Node.js';

const buffer = new DepthTexture();

export class ViewportDepthTextureNode extends ViewportTextureNode {
  constructor(uvNode: Node = viewportTopLeft, levelNode?: Node) {
    super(uvNode, levelNode, buffer);
  }
}

export const viewportDepthTexture = asCommand(ViewportDepthTextureNode);

implCommand('viewportDepthTexture', ViewportDepthTextureNode);
