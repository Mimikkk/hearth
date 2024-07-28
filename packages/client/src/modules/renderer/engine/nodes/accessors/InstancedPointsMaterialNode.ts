import MaterialNode from './MaterialNode.js';
import { fixedNode } from '../shadernode/ShaderNodes.js';

class InstancedPointsMaterialNode extends MaterialNode {
  static type = 'InstancedPointsMaterialNode';

  setup() {
    return this.getFloat(this.scope);
  }
}

InstancedPointsMaterialNode.POINT_WIDTH = 'pointWidth';

export default InstancedPointsMaterialNode;

export const materialPointWidth = fixedNode(InstancedPointsMaterialNode, InstancedPointsMaterialNode.POINT_WIDTH);
