import Binding from '@modules/renderer/threejs/renderers/common/Binding.js';
import NodeAttribute from '@modules/renderer/threejs/nodes/core/NodeAttribute.js';
import Node from '@modules/renderer/threejs/nodes/core/Node.js';

class NodeBuilderState {
  usedTimes: number = 0;

  constructor(
    public vertexShader: string | null,
    public fragmentShader: string | null,
    public computeShader: string | null,
    public nodeAttributes: NodeAttribute[],
    public bindings: Binding[],
    public updateNodes: Node[],
    public updateBeforeNodes: Node[],
    public transforms = [],
  ) {}

  createBindings() {
    const bindingsArray = [];

    for (const instanceBinding of this.bindings) {
      let binding = instanceBinding;

      if (instanceBinding.shared !== true) {
        binding = instanceBinding.clone();
      }

      bindingsArray.push(binding);
    }

    return bindingsArray;
  }
}

export default NodeBuilderState;
