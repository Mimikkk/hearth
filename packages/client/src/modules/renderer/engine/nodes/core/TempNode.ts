import Node from './Node.ts';
import { BuildStage } from '@modules/renderer/engine/renderers/webgpu/nodes/NodeBuilder.types.js';

class TempNode extends Node {
  static type = 'TempNode';

  constructor(type) {
    super(type);

    this.isTempNode = true;
  }

  hasDependencies(builder) {
    return builder.getDataFromNode(this).usageCount > 1;
  }

  build(builder, output) {
    const buildStage = builder.buildStage;

    if (buildStage === BuildStage.Generate) {
      const type = builder.getVectorType(this.getNodeType(builder, output));
      const nodeData = builder.getDataFromNode(this);

      if (builder.context.tempRead !== false && nodeData.propertyName !== undefined) {
        return builder.format(nodeData.propertyName, type, output);
      } else if (
        builder.context.tempWrite !== false &&
        type !== 'void' &&
        output !== 'void' &&
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

export default TempNode;
