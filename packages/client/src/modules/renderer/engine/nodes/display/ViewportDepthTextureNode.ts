import ViewportTextureNode from './ViewportTextureNode.js';
import { addNodeCommand, proxyNode } from '../shadernode/ShaderNodes.js';
import { viewportTopLeft } from './ViewportNode.js';
import { DepthTexture } from '@modules/renderer/engine/engine.js';

let sharedDepthbuffer = null;

class ViewportDepthTextureNode extends ViewportTextureNode {
  static type = 'ViewportDepthTextureNode';

  constructor(uvNode = viewportTopLeft, levelNode = null) {
    if (sharedDepthbuffer === null) {
      sharedDepthbuffer = new DepthTexture();
    }

    super(uvNode, levelNode, sharedDepthbuffer);
  }
}

export default ViewportDepthTextureNode;

export const viewportDepthTexture = proxyNode(ViewportDepthTextureNode);

addNodeCommand('viewportDepthTexture', viewportDepthTexture);
