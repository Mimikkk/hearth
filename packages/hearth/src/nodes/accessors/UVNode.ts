import { AttributeNode } from '../core/AttributeNode.js';
import { asCommand, asNode } from '../shadernode/ShaderNode.primitves.js';
import { TypeName } from '../../nodes/builder/NodeBuilder.types.js';
import { ConstNode } from '../../nodes/core/ConstNode.js';

export class UVNode extends AttributeNode {
  constructor(public index: ConstNode<number> = asNode(0)) {
    super(index.value > 0 ? 'uv' + index.value : 'uv', TypeName.vec2);
  }
}

export const uv = asCommand(UVNode);
