import UniformNode from '../core/UniformNode.js';
import { asNode } from '../shadernode/ShaderNodes.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

class BufferNode extends UniformNode<Buffer | number[] | null> {
  constructor(
    value: Buffer | number[] | null,
    public bufferType: TypeName,
    public bufferCount: number = 0,
  ) {
    console.log({ value });
    super(value, bufferType);
  }

  getInputType(): TypeName {
    return TypeName.buffer;
  }
}

export default BufferNode;

export const buffer = (value: Buffer | number[] | null, type: TypeName, count: number) =>
  asNode(new BufferNode(value, type, count));
