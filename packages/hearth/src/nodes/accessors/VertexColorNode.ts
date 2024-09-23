import { AttributeNode } from '../core/AttributeNode.js';
import { asCommand, asNode } from '../shadernode/ShaderNode.primitves.js';
import { TypeName } from '../../nodes/builder/NodeBuilder.types.js';
import { NodeBuilder } from '../../nodes/builder/NodeBuilder.js';
import { ConstNode } from '../../nodes/core/ConstNode.js';
import { Vec4 } from '../../math/Vec4.js';

export class VertexColorNode extends AttributeNode {
  constructor(public index: ConstNode<number> = asNode(0)) {
    super(index.value > 0 ? 'color' + index.value : 'color', TypeName.vec4);
  }

  generate(builder: NodeBuilder): string {
    const hasAttribute = builder.hasGeometryAttribute(this.name);
    if (hasAttribute) return super.generate(builder);

    return builder.codeConst(TypeName.vec4, Vec4.new(1, 1, 1, 1));
  }
}

export const vertexColor = asCommand(VertexColorNode);
