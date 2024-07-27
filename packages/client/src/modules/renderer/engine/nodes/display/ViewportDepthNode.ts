import { Node } from '../core/Node.js';
import { fixedNode, proxyNode } from '../shadernode/ShaderNodes.js';
import { cameraFar, cameraNear } from '../accessors/CameraNode.js';
import { positionView } from '../accessors/PositionNode.js';
import { viewportDepthTexture } from './ViewportDepthTextureNode.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

export class ViewportDepthNode extends Node {
  declare isViewportDepthNode: true;
  static type = 'ViewportDepthNode';
  mode: NodeVariant;

  constructor(public valueNode: Node) {
    super(TypeName.f32);
  }

  generate(builder: NodeBuilder): string | null {
    if (this.mode === NodeVariant.DepthPixel) return builder.useFragDepth();
    return super.generate(builder);
  }

  setup(): Node {
    switch (this.mode) {
      case NodeVariant.Depth:
        return viewZToOrthographicDepth(positionView.z, cameraNear, cameraFar);
      case NodeVariant.DepthTexture:
        const texture = this.valueNode || viewportDepthTexture();
        const viewZ = perspectiveDepthToViewZ(texture, cameraNear, cameraFar);

        return viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);
      case NodeVariant.DepthPixel:
        return depthPixelBase()(this.valueNode);
    }
  }
}

ViewportDepthNode.prototype.isViewportDepthNode = true;

export default ViewportDepthNode;

enum NodeVariant {
  Depth = 'depth',
  DepthTexture = 'depthTexture',
  DepthPixel = 'depthPixel',
}

export const viewZToOrthographicDepth = (viewZ: Node, near: Node, far: Node) => viewZ.add(near).div(near.sub(far));
export const orthographicDepthToViewZ = (depth: Node, near: Node, far: Node) => near.sub(far).mul(depth).sub(near);
export const viewZToPerspectiveDepth = (viewZ: Node, near: Node, far: Node) =>
  near.add(viewZ).mul(far).div(near.sub(far).mul(viewZ));

export const perspectiveDepthToViewZ = (depth: Node, near: Node, far: Node) =>
  near.mul(far).div(far.sub(near).mul(depth).sub(far));

const depthPixelBase = proxyNode(
  class extends ViewportDepthNode {
    mode = NodeVariant.DepthPixel;
  },
);
export const depth = fixedNode(
  class extends ViewportDepthNode {
    mode = NodeVariant.Depth;
  },
);
export const depthTexture = proxyNode(
  class extends ViewportDepthNode {
    mode = NodeVariant.DepthTexture;
  },
);
export const depthPixel = proxyNode(
  class extends ViewportDepthNode {
    mode = NodeVariant.DepthPixel;
  },
);
