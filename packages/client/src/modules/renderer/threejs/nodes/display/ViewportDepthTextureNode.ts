import ViewportTextureNode from './ViewportTextureNode.js';
import { addNodeElement, nodeProxy } from '../shadernode/ShaderNodes.js';
import { viewportTopLeft } from './ViewportNode.js';
import { DepthTexture } from '../../../threejs/Three.js';

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

export const viewportDepthTexture = nodeProxy(ViewportDepthTextureNode);

addNodeElement('viewportDepthTexture', viewportDepthTexture);
