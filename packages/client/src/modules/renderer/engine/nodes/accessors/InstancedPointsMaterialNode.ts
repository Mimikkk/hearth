import { MaterialNode } from './MaterialNode.js';
import { fixedNode } from '../shadernode/ShaderNodes.js';

export class InstancedPointsMaterialNode extends MaterialNode {
  setup() {
    return this.getFloat(this.scope);
  }
}

InstancedPointsMaterialNode.POINT_WIDTH = 'pointWidth';

export const materialPointWidth = fixedNode(InstancedPointsMaterialNode, InstancedPointsMaterialNode.POINT_WIDTH);
