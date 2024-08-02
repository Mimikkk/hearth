import { addNodeCommand, proxyNode } from '../shadernode/ShaderNodes.js';
import ArrayElementNode from './ArrayElementNode.js';

export class StorageArrayElementNode extends ArrayElementNode {
  static type = 'StorageArrayElementNode';

  generate(builder, output) {
    const isAssign = builder.context.assign;

    let code = super.generate(builder);

    if (isAssign !== true) {
      const type = this.getNodeType(builder);

      code = builder.format(code, type, output);
    }

    return code;
  }
}

export default StorageArrayElementNode;

export const storageElement = proxyNode(StorageArrayElementNode);

addNodeCommand('storageElement', storageElement);
