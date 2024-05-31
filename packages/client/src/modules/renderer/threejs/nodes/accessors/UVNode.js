import AttributeNode from '../core/AttributeNode.js';
import { nodeObject } from '../shadernode/ShaderNode.js';

class UVNode extends AttributeNode {
  static type = 'UVNode';

  constructor(index = 0) {
    super(null, 'vec2');

    this.isUVNode = true;

    this.index = index;
  }

  getAttributeName(/*builder*/) {
    const index = this.index;

    return 'uv' + (index > 0 ? index : '');
  }
}

export default UVNode;

export const uv = (...params) => nodeObject(new UVNode(...params));
