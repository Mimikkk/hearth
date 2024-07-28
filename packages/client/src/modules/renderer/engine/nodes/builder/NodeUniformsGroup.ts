import BindingUniformsGroup from '../../renderers/bindings/BindingUniformsGroup.js';
import UniformGroupNode from '@modules/renderer/engine/nodes/core/UniformGroupNode.js';
import { ValueNodeUniform } from '@modules/renderer/engine/nodes/builder/NodeUniform.js';
import { BindingUniform } from '@modules/renderer/engine/renderers/bindings/BindingUniform.js';

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

  getNodes(): BindingUniform[] {
    const nodes = [];

    for (const uniform of this.uniforms) {
      const node = uniform.uniform.node;

      if (!node) throw new Error('NodeUniformsGroup: Uniform has no node.');

      nodes.push(node);
    }

    return nodes;
  }
}

NodeUniformsGroup.prototype.isNodeUniformsGroup = true;

export default NodeUniformsGroup;
