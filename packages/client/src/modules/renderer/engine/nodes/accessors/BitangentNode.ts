import Node from '../core/Node.js';
import { varying } from '../core/VaryingNode.js';
import { normalize } from '../math/MathNode.js';
import { cameraViewMatrix } from './CameraNode.js';
import { normalGeometry, normalLocal, normalView, normalWorld, transformedNormalView } from './NormalNode.js';
import { tangentGeometry, tangentLocal, tangentView, tangentWorld, transformedTangentView } from './TangentNode.js';
import { fixedNode } from '../shadernode/ShaderNodes.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';

class BitangentNode extends Node {
  static type = 'BitangentNode';
  scope: NodeVariant;

  constructor() {
    super(TypeName.vec3);
  }

  getHash() {
    return `bitangent-${this.scope}`;
  }

  #crossNormalTangent() {
    switch (this.scope) {
      case NodeVariant.Geometry:
        return tangentGeometry.cross(normalGeometry);
      case NodeVariant.Local:
        return tangentLocal.cross(normalLocal);
      case NodeVariant.View:
        return tangentView.cross(normalView);
      case NodeVariant.World:
        return tangentWorld.cross(normalWorld);
    }
  }

  generate(builder: NodeBuilder): string {
    const vertexNode = this.#crossNormalTangent().mul(tangentGeometry.w).xyz;
    const outputNode = normalize(varying(vertexNode));

    return outputNode.build(builder, this.getNodeType(builder));
  }
}

enum NodeVariant {
  Geometry = 'geometry',
  Local = 'local',
  View = 'view',
  World = 'world',
}

export default BitangentNode;

export const bitangentGeometry = fixedNode(
  class extends BitangentNode {
    scope = NodeVariant.Geometry;
  },
);
export const bitangentLocal = fixedNode(
  class extends BitangentNode {
    scope = NodeVariant.Local;
  },
);
export const bitangentView = fixedNode(
  class extends BitangentNode {
    scope = NodeVariant.View;
  },
);
export const bitangentWorld = fixedNode(
  class extends BitangentNode {
    scope = NodeVariant.World;
  },
);

export const transformedBitangentView = normalize(
  transformedNormalView.cross(transformedTangentView).mul(tangentGeometry.w),
);
export const transformedBitangentWorld = normalize(transformedBitangentView.transformDirection(cameraViewMatrix));
