import { Node } from '../core/Node.js';
import { NodeUpdateType } from '../core/constants.js';
import { addNodeCommand, asNode } from '../shadernode/ShaderNodes.js';
import { Forge } from '@modules/renderer/engine/renderers/Forge.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { ShaderStage } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

class ComputeNode extends Node {
  static type = 'ComputeNode';
  declare id: number;
  declare isComputeNode: boolean;
  computeNode: any;
  count: number;
  workgroupSize: number[];
  dispatchCount: number;

  constructor(computeNode: any, count: number, workgroupSize: number[] = [64]) {
    super('void');

    this.isComputeNode = true;

    this.computeNode = computeNode;

    this.count = count;
    this.workgroupSize = workgroupSize;
    this.dispatchCount = 0;

    this.version = 1;
    this.updateBeforeType = NodeUpdateType.Object;

    this.updateDispatchCount();
  }

  set needsUpdate(value: boolean) {
    if (value === true) this.version++;
  }

  updateDispatchCount() {
    const { count, workgroupSize } = this;

    let size = workgroupSize[0];

    for (let i = 1; i < workgroupSize.length; i++) size *= workgroupSize[i];

    this.dispatchCount = Math.ceil(count / size);
  }

  onInit() {}

  updateBefore(x: { renderer: Forge }) {
    const { renderer } = x;
    renderer.compute(this);
  }

  generate(builder: NodeBuilder) {
    const { shaderStage } = builder;

    if (shaderStage === ShaderStage.Compute) {
      const snippet = this.computeNode.build(builder, 'void');

      if (snippet !== '') {
        builder.addLineFlowCode(snippet);
      }
    }
  }
}

export default ComputeNode;

export const compute = (node: any, count: number, workgroupSize: number[] = [64]) =>
  asNode(new ComputeNode(asNode(node), count, workgroupSize));

addNodeCommand('compute', compute);
