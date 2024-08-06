import { AttributeNode } from '../core/AttributeNode.js';
import { asCommand, asNode } from '../shadernode/ShaderNodes.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { ConstNode } from '@modules/renderer/engine/nodes/core/ConstNode.js';

export class UVNode extends AttributeNode {
  constructor(public index: ConstNode<number> = asNode(0)) {
    super(index.value > 0 ? 'uv' + index.value : 'uv', TypeName.vec2);
  }
}

export const uv = asCommand(UVNode);
