import Node from '../core/Node.js';
import { varying } from '../core/VaryingNode.js';
import { normalize } from '../math/MathNode.js';
import { cameraViewMatrix } from './CameraNode.js';
import { normalGeometry, normalLocal, normalView, normalWorld, transformedNormalView } from './NormalNode.js';
import { tangentGeometry, tangentLocal, tangentView, tangentWorld, transformedTangentView } from './TangentNode.js';
import { nodeImmutable } from '../shadernode/ShaderNodes.js';

class BitangentNode extends Node {
  static type = 'BitangentNode';

  constructor(scope = BitangentNode.LOCAL) {
    super('vec3');

    this.scope = scope;
  }

  getHash(/*builder*/) {
    return `bitangent-${this.scope}`;
  }

  generate(builder) {
    const scope = this.scope;

    let crossNormalTangent;

    if (scope === BitangentNode.GEOMETRY) {
      crossNormalTangent = normalGeometry.cross(tangentGeometry);
    } else if (scope === BitangentNode.LOCAL) {
      crossNormalTangent = normalLocal.cross(tangentLocal);
    } else if (scope === BitangentNode.VIEW) {
      crossNormalTangent = normalView.cross(tangentView);
    } else if (scope === BitangentNode.WORLD) {
      crossNormalTangent = normalWorld.cross(tangentWorld);
    }

    const vertexNode = crossNormalTangent.mul(tangentGeometry.w).xyz;

    const outputNode = normalize(varying(vertexNode));

    return outputNode.build(builder, this.getNodeType(builder));
  }
}

BitangentNode.GEOMETRY = 'geometry';
BitangentNode.LOCAL = 'local';
BitangentNode.VIEW = 'view';
BitangentNode.WORLD = 'world';

export default BitangentNode;

export const bitangentGeometry = nodeImmutable(BitangentNode, BitangentNode.GEOMETRY);
export const bitangentLocal = nodeImmutable(BitangentNode, BitangentNode.LOCAL);
export const bitangentView = nodeImmutable(BitangentNode, BitangentNode.VIEW);
export const bitangentWorld = nodeImmutable(BitangentNode, BitangentNode.WORLD);
export const transformedBitangentView = normalize(
  transformedNormalView.cross(transformedTangentView).mul(tangentGeometry.w),
);
export const transformedBitangentWorld = normalize(transformedBitangentView.transformDirection(cameraViewMatrix));
