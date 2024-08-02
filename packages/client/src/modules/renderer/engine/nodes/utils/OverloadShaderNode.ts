import { Node } from '../core/Node.js';
import { proxyNode, ShaderCallNode, Hsl } from '../shadernode/ShaderNodes.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

export class OverloadShaderNode extends Node {
  call: ShaderCallNode;

  constructor(
    public fns: Hsl[],
    public parameters: Node[],
  ) {
    for (const fn of fns) {
      if (!fn.node.layout) throw new Error('OverloadShaderNode: Overloaded functions must contain layout.');
    }

    super();
  }

  getNodeType(): TypeName {
    return this.fns[0].node.layout!.type;
  }

  setup(builder: NodeBuilder): ShaderCallNode {
    let { parameters, call, fns } = this;

    if (!call) {
      call = matchBest(parameters, fns, builder)!(...parameters);
      this.call = call;
    }

    return call;
  }
}

const overload = proxyNode(OverloadShaderNode);

export const overloadFn =
  <Fn extends (...params: any) => any>(shaders: Hsl<Fn>[]) =>
  (...params: Parameters<Fn>) =>
    overload(shaders, params);

const matchBest = (params: Node[], fns: Hsl[], builder: NodeBuilder): Hsl => {
  let bestFn!: Hsl;
  let bestScore = -1;

  for (const fn of fns) {
    const node = fn.node;
    const layout = node.layout!;

    const parameters = layout.inputs;
    if (params.length === parameters.length) {
      let score = 0;

      for (let i = 0; i < params.length; i++) {
        const first = params[i];
        const second = parameters[i];

        if (first.getNodeType(builder) === second.type) {
          ++score;
        } else {
          score = 0;
        }
      }

      if (score > bestScore) {
        bestFn = fn;
        bestScore = score;
      }
    }
  }

  return bestFn;
};
