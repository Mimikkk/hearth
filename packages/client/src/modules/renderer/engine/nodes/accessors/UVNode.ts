import { AttributeNode } from '../core/AttributeNode.js';
import { asNode } from '../shadernode/ShaderNodes.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

export class UVNode extends AttributeNode {
  constructor(public index: number) {
    super(index > 0 ? 'uv' + index : 'uv', TypeName.vec2);
  }
}

export const uv = (index: number = 0) => asNode(new UVNode(index));
