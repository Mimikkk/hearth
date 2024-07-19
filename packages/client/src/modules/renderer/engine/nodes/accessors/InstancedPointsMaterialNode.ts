import MaterialNode from './MaterialNode.js';
import { nodeImmutable } from '../shadernode/ShaderNodes.js';

class InstancedPointsMaterialNode extends MaterialNode {
  static type = 'InstancedPointsMaterialNode';

  setup(/*builder*/) {
    return this.getFloat(this.scope);
  }
}

InstancedPointsMaterialNode.POINT_WIDTH = 'pointWidth';

export default InstancedPointsMaterialNode;

export const materialPointWidth = nodeImmutable(InstancedPointsMaterialNode, InstancedPointsMaterialNode.POINT_WIDTH);
