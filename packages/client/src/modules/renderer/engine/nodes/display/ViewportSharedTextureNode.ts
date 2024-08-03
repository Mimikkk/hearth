import ViewportTextureNode from './ViewportTextureNode.js';
import { addNodeCommand, proxyNode } from '../shadernode/ShaderNodes.js';
import { viewportTopLeft } from './ViewportNode.js';
import { FramebufferTexture } from '@modules/renderer/engine/engine.js';

let _sharedFramebuffer = null;

class ViewportSharedTextureNode extends ViewportTextureNode {
  constructor(uvNode = viewportTopLeft, levelNode = null) {
    if (_sharedFramebuffer === null) {
      _sharedFramebuffer = new FramebufferTexture();
    }

    super(uvNode, levelNode, _sharedFramebuffer);
  }
}

export default ViewportSharedTextureNode;

export const viewportSharedTexture = proxyNode(ViewportSharedTextureNode);

addNodeCommand('viewportSharedTexture', viewportSharedTexture);
