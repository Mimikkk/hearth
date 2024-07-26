import Node from '../core/Node.js';
import { instancedBufferAttribute, instancedDynamicBufferAttribute } from './BufferAttributeNode.js';
import { normalLocal } from './NormalNode.js';
import { positionLocal } from './PositionNode.js';
import { mat3, mat4, proxyNode, vec3 } from '../shadernode/ShaderNodes.js';
import { Buffer, BufferUse } from '@modules/renderer/engine/engine.js';
import { BufferStep } from '@modules/renderer/engine/renderers/constants.js';

class InstanceNode extends Node {
  static type = 'InstanceNode';

  constructor(instanceMesh) {
    super('void');

    this.instanceMesh = instanceMesh;

    this.instanceMatrixNode = null;
  }

  setup(/*builder*/) {
    let instanceMatrixNode = this.instanceMatrixNode;

    if (instanceMatrixNode === null) {
      const instanceMesh = this.instanceMesh;
      const instanceAttribute = instanceMesh.instanceMatrix;
      const buffer = new Buffer(instanceAttribute.array, 16, BufferStep.Instance);

      const bufferFn =
        instanceAttribute.usage === BufferUse.DynamicDraw ? instancedDynamicBufferAttribute : instancedBufferAttribute;

      const instanceBuffers = [
        // F.Signature -> bufferAttribute( array, type, stride, offset )
        bufferFn(buffer, 'vec4', 16, 0),
        bufferFn(buffer, 'vec4', 16, 4),
        bufferFn(buffer, 'vec4', 16, 8),
        bufferFn(buffer, 'vec4', 16, 12),
      ];

      instanceMatrixNode = mat4(...instanceBuffers);

      this.instanceMatrixNode = instanceMatrixNode;
    }

    // POSITION

    const instancePosition = instanceMatrixNode.mul(positionLocal).xyz;

    // NORMAL

    const m = mat3(instanceMatrixNode[0].xyz, instanceMatrixNode[1].xyz, instanceMatrixNode[2].xyz);

    const transformedNormal = normalLocal.div(vec3(m[0].dot(m[0]), m[1].dot(m[1]), m[2].dot(m[2])));

    const instanceNormal = m.mul(transformedNormal).xyz;

    // ASSIGNS

    positionLocal.assign(instancePosition);
    normalLocal.assign(instanceNormal);
  }
}

export default InstanceNode;

export const instance = proxyNode(InstanceNode);
