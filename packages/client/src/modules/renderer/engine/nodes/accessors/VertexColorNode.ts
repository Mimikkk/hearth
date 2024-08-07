import { AttributeNode } from '../core/AttributeNode.js';
import { asCommand, asNode } from '../shadernode/ShaderNodes.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { ConstNode } from '@modules/renderer/engine/nodes/core/ConstNode.js';
import { Vec4 } from '@modules/renderer/engine/math/Vec4.js';

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
