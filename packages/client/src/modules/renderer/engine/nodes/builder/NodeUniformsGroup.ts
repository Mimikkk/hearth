import BindingUniformsGroup from '../../renderers/bindings/BindingUniformsGroup.js';
import UniformGroupNode from '@modules/renderer/engine/nodes/core/UniformGroupNode.js';
import { ValueNodeUniform } from '@modules/renderer/engine/nodes/builder/NodeUniform.js';

let id = 0;

export class NodeUniformsGroup extends BindingUniformsGroup {
  declare isNodeUniformsGroup: true;
  id: number;

  constructor(
    name: string,
    public groupNode: UniformGroupNode,
  ) {
    super(name);
    this.id = id++;
  }

  get shared() {
    return this.groupNode.shared;
  }

  getNodes(): ValueNodeUniform[] {
    const nodes = [];

    for (const uniform of this.uniforms) {
      const node = uniform.nodeUniform.node;

      if (!node) throw new Error('NodeUniformsGroup: Uniform has no node.');

      nodes.push(node);
    }

    return nodes;
  }
}

NodeUniformsGroup.prototype.isNodeUniformsGroup = true;

export default NodeUniformsGroup;
