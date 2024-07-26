import Binding from '@modules/renderer/engine/renderers/Binding.js';
import NodeAttribute from '@modules/renderer/engine/nodes/core/NodeAttribute.js';
import Node from '@modules/renderer/engine/nodes/core/Node.js';

export class NodeBuilderState {
  usedTimes: number = 0;

  constructor(
    public vertexShader: string | null,
    public fragmentShader: string | null,
    public computeShader: string | null,
    public nodeAttributes: NodeAttribute[],
    public bindings: Binding[],
    public updateNodes: Node[],
    public updateBeforeNodes: Node[],
  ) {}

  createBindings(): Binding[] {
    const bindings = [];

    for (let binding of this.bindings) {
      if (binding.shared !== true) {
        binding = binding.clone();
      }

      bindings.push(binding);
    }

    return bindings;
  }
}

export default NodeBuilderState;
