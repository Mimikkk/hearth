import { TempNode } from '../core/TempNode.js';
import { transformedNormalView } from '../accessors/NormalNode.js';
import { positionViewDirection } from '../accessors/PositionNode.js';
import { asNode, vec2, vec3 } from '../shadernode/ShaderNodes.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

export class MatcapUVNode extends TempNode {
  constructor() {
    super(TypeName.vec2);
  }

  setup() {
    const x = vec3(positionViewDirection.z, 0, positionViewDirection.x.negate()).normalize();
    const y = positionViewDirection.cross(x);

    return vec2(x.dot(transformedNormalView), y.dot(transformedNormalView)).mul(0.495).add(0.5);
  }
}

export const matcapUV = new MatcapUVNode();
