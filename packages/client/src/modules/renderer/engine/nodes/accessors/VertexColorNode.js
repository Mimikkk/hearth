import AttributeNode from '../core/AttributeNode.js';
import { nodeObject } from '../shadernode/ShaderNodes.js';
import { Vector4 } from '@modules/renderer/engine/engine.ts';

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
      result = builder.generateConst(this.nodeType, new Vector4(1, 1, 1, 1));
    }

    return result;
  }
}

export default VertexColorNode;

export const vertexColor = (...params) => nodeObject(new VertexColorNode(...params));
