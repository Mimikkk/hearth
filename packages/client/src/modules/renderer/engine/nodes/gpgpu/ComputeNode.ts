import { Node } from '../core/Node.js';
import { NodeUpdateStage } from '../core/constants.js';
import { addNodeCommand, asNode } from '../shadernode/ShaderNodes.js';
import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { ShaderStage } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

export class ComputeNode extends Node {
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
    this.updateBeforeType = NodeUpdateStage.Object;

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

  onInit(params: { hearth: Hearth }) {}

  updateBefore(params: { hearth: Hearth }) {
    params.hearth.compute(this);
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
