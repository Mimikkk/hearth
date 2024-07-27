import { UniformNode } from '../core/UniformNode.js';
import { asNode } from '../shadernode/ShaderNodes.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

export class BufferNode<T> extends UniformNode<T> {
  constructor(
    value: T,
    public bufferType: TypeName,
    public bufferCount: number = 0,
  ) {
    super(value, bufferType);
  }

  getInputType(): TypeName {
    return TypeName.buffer;
  }
}

export default BufferNode;

export const buffer = <T>(value: T, type: TypeName, count: number) => asNode(new BufferNode(value, type, count));
