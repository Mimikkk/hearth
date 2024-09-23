import { InputNode } from '../core/InputNode.js';
import { varying } from '../core/VaryingNode.js';
import { ShaderStage, TypeName } from '../../nodes/builder/NodeBuilder.types.js';
import { BufferStep } from '../../hearth/constants.js';
import type { BufferNode } from '../../nodes/accessors/BufferNode.js';
import { implCommand } from '../../nodes/core/Node.commands.js';
import type { NodeBuilder } from '../../nodes/builder/NodeBuilder.js';
import { BufferUse } from '../../constants.js';
import { Attribute } from '../../core/Attribute.js';

export class BufferAttributeNode<T> extends InputNode<T> {
  isBufferNode: true;

  bufferType: TypeName | undefined;
  bufferStride: number;
  bufferOffset: number;
  usage: BufferUse;
  instanced: boolean;
  attribute: Attribute;

  constructor(value: T, type: TypeName | undefined = undefined, bufferStride = 0, bufferOffset = 0) {
    super(value, type);

    this.bufferType = type;
    this.bufferStride = bufferStride;
    this.bufferOffset = bufferOffset;

    this.usage = BufferUse.StaticDraw;
    this.instanced = false;
    this.attribute = null;
    if (Attribute.is(value)) {
      this.attribute = value;
      this.usage = value.usage;
      this.instanced = value.instanced;
    }
  }

  getNodeType(builder: NodeBuilder): TypeName {
    if (!this.bufferType) this.bufferType = TypeName.ofAttribute(this.attribute);
    return this.bufferType;
  }

  setup(builder: NodeBuilder) {
    if (this.attribute) return;

    const type = this.getNodeType(builder);
    const array = this.value;
    const itemSize = TypeName.size(type);
    const stride = this.bufferStride || itemSize;
    const offset = this.bufferOffset;

    const buffer = array.isInterleavedBuffer === true ? array : new Buffer(array, stride);

    this.attribute = new Attribute(buffer, itemSize, offset, BufferStep.Vertex);
    this.attribute.step = BufferStep.Instance;
  }

  generate(builder: NodeBuilder): string {
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

  getInputType(): TypeName {
    return TypeName.attribute;
  }

  setUsage(value: BufferUse): this {
    this.usage = value;
    return this;
  }

  setInstanced(value: boolean): this {
    this.instanced = value;
    return this;
  }
}

BufferAttributeNode.prototype.isBufferNode = true;

export const bufferAttribute = (array, type, stride, offset) => new BufferAttributeNode(array, type, stride, offset);

export const dynamicBufferAttribute = (array, type, stride, offset) =>
  bufferAttribute(array, type, stride, offset).setUsage(BufferUse.DynamicDraw);

export const instancedBufferAttribute = (array, type, stride, offset) =>
  bufferAttribute(array, type, stride, offset).setInstanced(true);

export const instancedDynamicBufferAttribute = (array, type, stride, offset) =>
  dynamicBufferAttribute(array, type, stride, offset).setInstanced(true);

export class ToBufferAttributeNode<T> extends BufferAttributeNode<T> {
  constructor(bufferNode: BufferNode<T>) {
    super(bufferNode.value);
  }
}

implCommand('toAttribute', ToBufferAttributeNode);
