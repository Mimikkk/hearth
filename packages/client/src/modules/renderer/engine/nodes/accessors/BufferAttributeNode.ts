import InputNode from '../core/InputNode.js';
import { varying } from '../core/VaryingNode.js';
import { addNodeElement, nodeObject } from '../shadernode/ShaderNodes.js';
import { Buffer, BufferAttribute, BufferUsage } from '@modules/renderer/engine/engine.js';
import { ShaderStage } from '@modules/renderer/engine/renderers/nodes/NodeBuilder.types.js';
import { GPUVertexStepModeType } from '@modules/renderer/engine/renderers/utils/constants.js';

class BufferAttributeNode extends InputNode {
  static type = 'BufferAttributeNode';

  constructor(value, bufferType = null, bufferStride = 0, bufferOffset = 0) {
    super(value, bufferType);

    this.isBufferNode = true;

    this.bufferType = bufferType;
    this.bufferStride = bufferStride;
    this.bufferOffset = bufferOffset;

    this.usage = BufferUsage.StaticDraw;
    this.instanced = false;

    this.attribute = null;

    if (value && value.isBufferAttribute === true) {
      this.attribute = value;
      this.usage = value.usage;
      this.instanced = value.isInstancedBufferAttribute;
    }
  }

  getNodeType(builder) {
    if (this.bufferType === null) {
      this.bufferType = builder.getTypeFromAttribute(this.attribute);
    }

    return this.bufferType;
  }

  setup(builder) {
    if (this.attribute !== null) return;

    const type = this.getNodeType(builder);
    const array = this.value;
    const itemSize = builder.getTypeLength(type);
    const stride = this.bufferStride || itemSize;
    const offset = this.bufferOffset;

    const buffer = array.isInterleavedBuffer === true ? array : new Buffer(array, stride);
    const bufferAttribute = new BufferAttribute(
      buffer,
      itemSize,
      offset,
      GPUVertexStepModeType.Vertex,
      undefined,
      true,
    );

    this.attribute = bufferAttribute;
    this.attribute.step = GPUVertexStepModeType.Instance;
  }

  generate(builder) {
    const nodeType = this.getNodeType(builder);

    const nodeAttribute = builder.getBufferAttributeFromNode(this, nodeType);
    const propertyName = builder.getPropertyName(nodeAttribute);

    let output = null;

    if (builder.shaderStage === ShaderStage.Vertex || builder.shaderStage === ShaderStage.Compute) {
      this.name = propertyName;

      output = propertyName;
    } else {
      const nodeVarying = varying(this);

      output = nodeVarying.build(builder, nodeType);
    }

    return output;
  }

  getInputType(/*builder*/) {
    return 'bufferAttribute';
  }

  setUsage(value) {
    this.usage = value;

    return this;
  }

  setInstanced(value) {
    this.instanced = value;

    return this;
  }
}

export default BufferAttributeNode;

export const bufferAttribute = (array, type, stride, offset) =>
  nodeObject(new BufferAttributeNode(array, type, stride, offset));
export const dynamicBufferAttribute = (array, type, stride, offset) =>
  bufferAttribute(array, type, stride, offset).setUsage(BufferUsage.DynamicDraw);

export const instancedBufferAttribute = (array, type, stride, offset) =>
  bufferAttribute(array, type, stride, offset).setInstanced(true);
export const instancedDynamicBufferAttribute = (array, type, stride, offset) =>
  dynamicBufferAttribute(array, type, stride, offset).setInstanced(true);

addNodeElement('toAttribute', bufferNode => bufferAttribute(bufferNode.value));
