import { Node } from '../core/Node.js';
import { NodeUpdateStage } from '../core/constants.js';
import { Hearth } from '../../hearth/Hearth.js';
import { NodeBuilder } from '../../nodes/builder/NodeBuilder.js';
import { ShaderStage, TypeName } from '../../nodes/builder/NodeBuilder.types.js';
import { FunctionCallNode } from '../../nodes/code/FunctionCallNode.js';
import { NodeFrame } from '../../nodes/core/NodeFrame.js';
import { implCommand } from '../../nodes/core/Node.commands.js';
import { ConstNode } from '../../nodes/core/ConstNode.js';
import { ShaderCallNode } from '../../nodes/shadernode/ShaderNode.js';

export class ComputeNode extends Node {
  dispatchCount: number;

  constructor(
    public call: ShaderCallNode | FunctionCallNode,
    count: ConstNode,
    size: number[] = [64],
  ) {
    super(TypeName.void);

    this.version = 1;
    this.updateBeforeType = NodeUpdateStage.Object;

    let work = size[0];
    for (let i = 1; i < size.length; i++) work *= size[i];

    this.dispatchCount = Math.ceil(count.value / work);
  }

  set useUpdate(value: boolean) {
    if (value === true) this.version++;
  }

  onInit(hearth: Hearth) {}

  updateBefore(frame: NodeFrame): void {
    frame.hearth.compute(this);
  }

  generate(builder: NodeBuilder): string {
    const { shaderStage } = builder;

    if (shaderStage === ShaderStage.Compute) {
      const code = this.call.build(builder, TypeName.void);

      if (code) builder.addLineFlowCode(code);
    }
  }
}

implCommand('compute', ComputeNode);
