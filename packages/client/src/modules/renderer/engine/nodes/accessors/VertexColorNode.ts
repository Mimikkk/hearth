import AttributeNode from '../core/AttributeNode.js';
import { asNode } from '../shadernode/ShaderNodes.js';
import { Vec4 } from '@modules/renderer/engine/engine.js';

class VertexColorNode extends AttributeNode {
  static type = 'VertexColorNode';

  constructor(index = 0) {
    super(null, 'vec4');

    this.isVertexColorNode = true;

    this.index = index;
  }

  getAttributeName(/*builder*/) {
    const index = this.index;

    return 'color' + (index > 0 ? index : '');
  }

  generate(builder) {
    const attributeName = this.getAttributeName(builder);
    const geometryAttribute = builder.hasGeometryAttribute(attributeName);

    let result;

    if (geometryAttribute === true) {
      result = super.generate(builder);
    } else {
      // Vertex color fallback should be white
      result = builder.generateConst(this.nodeType, Vec4.new(1, 1, 1, 1));
    }

    return result;
  }
}

export default VertexColorNode;

export const vertexColor = (...params) => asNode(new VertexColorNode(...params));
