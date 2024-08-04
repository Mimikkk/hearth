import { Node } from './Node.js';
import { varying } from './VaryingNode.js';
import { fixedNode } from '../shadernode/ShaderNodes.js';
import { ShaderStage, TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';

export class IndexNode extends Node {
  scope: Variant;

  constructor() {
    super(TypeName.u32);
  }

  generate(builder: NodeBuilder): string {
    const nodeType = this.getNodeType(builder);
    const scope = this.scope;

    let propertyName;

    if (scope === Variant.Vertex) {
      propertyName = builder.useVertexIndex();
    } else if (scope === Variant.Instance) {
      propertyName = builder.UseInstanceIndex();
    } else {
      throw new Error('IndexNode: Unknown scope: ' + scope);
    }

    let output;

    if (builder.shaderStage === ShaderStage.Vertex || builder.shaderStage === ShaderStage.Compute) {
      output = propertyName;
    } else {
      const nodeVarying = varying(this);

      output = nodeVarying.build(builder, nodeType);
    }

    return output;
  }
}

enum Variant {
  Vertex = 'Vertex',
  Instance = 'Instance',
}

export const vertexIndex = fixedNode(
  class extends IndexNode {
    scope = Variant.Vertex;
  },
);
export const instanceIndex = fixedNode(
  class extends IndexNode {
    scope = Variant.Instance;
  },
);
