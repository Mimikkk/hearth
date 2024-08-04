import { AttributeNode } from '../core/AttributeNode.js';
import { asNode } from '../shadernode/ShaderNodes.js';
import { Vec4 } from '@modules/renderer/engine/engine.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';

export class VertexColorNode extends AttributeNode {
  constructor(public index: number) {
    super(index > 0 ? 'color' + index : 'color', TypeName.vec4);
  }

  generate(builder: NodeBuilder): string {
    const hasAttribute = builder.hasGeometryAttribute(this.name);
    if (hasAttribute) return super.generate(builder);

    return builder.codeConst(TypeName.vec4, Vec4.new(1, 1, 1, 1));
  }
}



export const vertexColor = (index: number = 0) => asNode(new VertexColorNode(index));
