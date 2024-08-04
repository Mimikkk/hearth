import { TempNode } from '../core/TempNode.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { XYZW } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.handlers.js';
import { Node } from '../core/Node.js';

export class SetNode extends TempNode {
  constructor(
    public sourceNode: Node,
    public components: XYZW,
    public targetNode: Node,
  ) {
    super();
  }

  getNodeType(builder: NodeBuilder) {
    return this.sourceNode.getNodeType(builder);
  }

  generate(builder: NodeBuilder) {
    const { sourceNode, components, targetNode } = this;

    const sourceType = this.getNodeType(builder);
    const targetType = TypeName.ofSize(components.length, TypeName.f32);

    const targetSnippet = targetNode.build(builder, targetType);
    const sourceSnippet = sourceNode.build(builder, sourceType);

    const length = TypeName.size(sourceType);
    const parameters = [];

    for (let i = 0; i < length; i++) {
      const component = 'xyzw'[i];

      if (component === components[0]) {
        parameters.push(targetSnippet);

        i += components.length - 1;
      } else {
        parameters.push(sourceSnippet + '.' + component);
      }
    }

    return `${TypeName.repr(sourceType)}(${parameters.join(', ')})`;
  }
}

Node.Map.set('set', SetNode);
