import { Node } from '../core/Node.js';
import { buffer } from '../accessors/BufferNode.js';
import { instanceIndex } from '../core/IndexNode.js';
import { f32, asCommand } from '../shadernode/ShaderNodes.js';

import { InstancedMesh, Vec4 } from '@modules/renderer/engine/engine.js';
import { lerp } from '../../math/MathUtils.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

let min = null;
let max = null;

export class RangeNode extends Node {
  constructor(minNode = f32(), maxNode = f32()) {
    super();

    this.minNode = minNode;
    this.maxNode = maxNode;
  }

  getVectorLength(builder: NodeBuilder): number {
    const minLength = TypeName.size(TypeName.ofValue(this.minNode.value));
    const maxLength = TypeName.size(TypeName.ofValue(this.maxNode.value));

    return minLength > maxLength ? minLength : maxLength;
  }

  getNodeType(builder: NodeBuilder) {
    return InstancedMesh.is(builder.object)
      ? TypeName.ofSize(this.getVectorLength(builder), TypeName.f32)
      : TypeName.f32;
  }

  setup(builder) {
    const object = builder.object;

    let output = null;

    if (object.isInstancedMesh === true) {
      const minValue = this.minNode.value;
      const maxValue = this.maxNode.value;

      const minLength = TypeName.size(TypeName.ofValue(minValue));
      const maxLength = TypeName.size(TypeName.ofValue(maxValue));

      min = min || Vec4.new();
      max = max || Vec4.new();

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

export const range = asCommand(RangeNode);
