import { Binding } from '../../hearth/bindings/Binding.js';
import { NodeAttribute } from '../../nodes/core/NodeAttribute.js';
import { Node } from '../../nodes/core/Node.js';

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
      if (!binding.shared) binding = binding.clone();

      bindings.push(binding);
    }

    return bindings;
  }
}
