import Node from './Node.js';
import { BuildStage, TypeName } from '@modules/renderer/engine/renderers/webgpu/nodes/NodeBuilder.types.js';
import { NodeBuilder } from '@modules/renderer/engine/renderers/webgpu/nodes/NodeBuilder.js';

export class TempNode extends Node {
  static type = 'TempNode';
  isTempNode: true;

  constructor(type: TypeName | null = null) {
    super(type);
  }

  static is(node: any): node is TempNode {
    return node?.isTempNode === true;
  }

  hasDependencies(builder: NodeBuilder): boolean {
    return builder.getDataFromNode(this).usageCount > 1;
  }

  build(builder: NodeBuilder, output: TypeName) {
    const buildStage = builder.buildStage;

    if (buildStage === BuildStage.Generate) {
      const type = builder.getVectorType(this.getNodeType(builder, output));
      const nodeData = builder.getDataFromNode(this);

      if (nodeData.propertyName !== undefined) {
        return builder.format(nodeData.propertyName, type, output);
      } else if (
        builder.context.tempWrite !== false &&
        type !== TypeName.void &&
        output !== TypeName.void &&
        this.hasDependencies(builder)
      ) {
        const snippet = super.build(builder, type);

        const nodeVar = builder.getVarFromNode(this, null, type);
        const propertyName = builder.getPropertyName(nodeVar);

        builder.addLineFlowCode(`${propertyName} = ${snippet}`);

        nodeData.snippet = snippet;
        nodeData.propertyName = propertyName;

        return builder.format(nodeData.propertyName, type, output);
      }
    }

    return super.build(builder, output);
  }
}

TempNode.prototype.isTempNode = true;

export default TempNode;
