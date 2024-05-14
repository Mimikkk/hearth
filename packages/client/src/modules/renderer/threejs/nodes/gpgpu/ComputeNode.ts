import Node, { addNodeClass } from '../core/Node.js';
import { NodeUpdateType } from '../core/constants.ts';
import { addNodeElement, nodeObject } from '../shadernode/ShaderNode.js';
import { Renderer } from '@modules/renderer/threejs/renderers/common/Renderer.js';
import NodeBuilder from '@modules/renderer/threejs/nodes/core/NodeBuilder.js';

class ComputeNode extends Node {
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
    this.updateBeforeType = NodeUpdateType.OBJECT;

    this.updateDispatchCount();
  }

  dispose() {
    this.eventDispatcher.dispatch({ type: 'dispose' }, this);
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

  updateBefore(x: { renderer: Renderer }) {
    const { renderer } = x;
    renderer.compute(this);
  }

  generate(builder: NodeBuilder) {
    const { shaderStage } = builder;

    if (shaderStage === 'compute') {
      const snippet = this.computeNode.build(builder, 'void');

      if (snippet !== '') {
        builder.addLineFlowCode(snippet);
      }
    }
  }
}

export default ComputeNode;

export const compute = (node: any, count: number, workgroupSize: number[] = [64]) =>
  nodeObject(new ComputeNode(nodeObject(node), count, workgroupSize));

addNodeElement('compute', compute);

addNodeClass('ComputeNode', ComputeNode);
