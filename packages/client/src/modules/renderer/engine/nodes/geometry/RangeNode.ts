import Node from '../core/Node.js';
import { getValueType } from '../core/NodeUtils.js';
import { buffer } from '../accessors/BufferNode.js';
import { instanceIndex } from '../core/IndexNode.js';
import { f32, nodeProxy } from '../shadernode/ShaderNodes.js';

import { Vec4 } from '@modules/renderer/engine/engine.js';
import { lerp } from '../../math/MathUtils.js';

let min = null;
let max = null;

class RangeNode extends Node {
  static type = 'RangeNode';

  constructor(minNode = f32(), maxNode = f32()) {
    super();

    this.minNode = minNode;
    this.maxNode = maxNode;
  }

  getVectorLength(builder) {
    const minLength = builder.getTypeLength(getValueType(this.minNode.value));
    const maxLength = builder.getTypeLength(getValueType(this.maxNode.value));

    return minLength > maxLength ? minLength : maxLength;
  }

  getNodeType(builder) {
    return builder.object.isInstancedMesh === true ? builder.getTypeFromLength(this.getVectorLength(builder)) : 'f32';
  }

  setup(builder) {
    const object = builder.object;

    let output = null;

    if (object.isInstancedMesh === true) {
      const minValue = this.minNode.value;
      const maxValue = this.maxNode.value;

      const minLength = builder.getTypeLength(getValueType(minValue));
      const maxLength = builder.getTypeLength(getValueType(maxValue));

      min = min || new Vec4();
      max = max || new Vec4();

      min.setScalar(0);
      max.setScalar(0);

      if (minLength === 1) min.setScalar(minValue);
      else if (minValue.isColor) min.set(minValue.r, minValue.g, minValue.b);
      else min.set(minValue.x, minValue.y, minValue.z || 0, minValue.w || 0);

      if (maxLength === 1) max.setScalar(maxValue);
      else if (maxValue.isColor) max.set(maxValue.r, maxValue.g, maxValue.b);
      else max.set(maxValue.x, maxValue.y, maxValue.z || 0, maxValue.w || 0);

      const stride = 4;

      const length = stride * object.count;
      const array = new Float32Array(length);

      for (let i = 0; i < length; i++) {
        const index = i % stride;

        let x = index === 0 ? 'x' : index === 1 ? 'y' : index === 2 ? 'z' : 'w';
        const minElementValue = min[x];
        const maxElementValue = max[x];

        array[i] = lerp(minElementValue, maxElementValue, Math.random());
      }

      const nodeType = this.getNodeType(builder);

      output = buffer(array, 'vec4', object.count).element(instanceIndex).convert(nodeType);
    } else {
      output = f32(0);
    }

    return output;
  }
}

export default RangeNode;

export const range = nodeProxy(RangeNode);
