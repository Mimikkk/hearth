import { asCommand } from '../shadernode/ShaderNode.primitves.js';
import { ArrayElementNode } from './ArrayElementNode.js';
import { NodeBuilder } from '../../nodes/builder/NodeBuilder.js';
import { TypeName } from '../../nodes/builder/NodeBuilder.types.js';
import { implCommand } from '../../nodes/core/Node.commands.js';

export class StorageArrayElementNode extends ArrayElementNode {
  generate(builder: NodeBuilder, output: TypeName): string {
    const isAssign = builder.context.assign;

    let code = super.generate(builder);

    if (isAssign !== true) {
      const type = this.getNodeType(builder);

      code = builder.format(code, type, output);
    }

    return code;
  }
}

export const storageElement = asCommand(StorageArrayElementNode);

implCommand('storageElement', StorageArrayElementNode);
