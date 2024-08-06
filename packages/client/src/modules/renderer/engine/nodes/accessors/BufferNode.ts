import { UniformNode } from '../core/UniformNode.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { asCommand, asNode } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.as.js';
import { ConstNode } from '@modules/renderer/engine/nodes/core/ConstNode.js';

export class BufferNode<T> extends UniformNode<T> {
  constructor(
    value: T,
    public bufferType: TypeName,
    public bufferCount: ConstNode<number> = asNode(0),
  ) {
    super(value, bufferType);
  }

  getInputType(): TypeName {
    return TypeName.buffer;
  }
}

export const buffer = asCommand(BufferNode) as unknown as <T>(value: T, type: TypeName, count: number) => BufferNode<T>;
