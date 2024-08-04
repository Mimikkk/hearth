import { Node } from './Node.js';
import { BuildStage, TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';

export class TempNode extends Node {
  hasDependencies(builder: NodeBuilder): boolean {
    return builder.getDataFromNode(this).usageCount > 1;
  }

  build(builder: NodeBuilder, output: TypeName): string {
    const buildStage = builder.buildStage;

    if (buildStage === BuildStage.Generate) {
      let type = TypeName.coerce(this.getNodeType(builder, output));
      const data = builder.getDataFromNode(this);

      if (data.propertyName) {
        return builder.format(data.propertyName, type, output);
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

        data.snippet = snippet;
        data.propertyName = propertyName;

        return builder.format(data.propertyName, type, output);
      }
    }

    return super.build(builder, output);
  }
}
