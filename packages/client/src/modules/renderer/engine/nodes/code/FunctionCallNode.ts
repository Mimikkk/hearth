import { TempNode } from '../core/TempNode.js';
import { asNode } from '../shadernode/ShaderNodes.js';
import { FunctionNode } from './FunctionNode.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { Node } from '@modules/renderer/engine/nodes/core/Node.js';
import { asNodes } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.as.js';
import { nodeProxy } from 'three/src/nodes/shadernode/ShaderNode.js';
import { implCommand } from '@modules/renderer/engine/nodes/core/Node.commands.js';

export class FunctionCallNode extends TempNode {
  constructor(
    public shader: FunctionNode,
    public parameters: Record<string, any>,
  ) {
    super();
  }

  getNodeType(builder: NodeBuilder): TypeName {
    return this.shader.getNodeType(builder);
  }

  generate(builder: NodeBuilder): string {
    const params = [];

    const functionNode = this.shader;

    const inputs = functionNode.getInputs(builder);
    const parameters = this.parameters;

    if (Array.isArray(parameters)) {
      for (let i = 0; i < parameters.length; i++) {
        const inputNode = inputs[i];
        const node = parameters[i];

        params.push(node.build(builder, inputNode.type));
      }
    } else {
      for (const inputNode of inputs) {
        const node = parameters[inputNode.name];

        if (node !== undefined) {
          params.push(node.build(builder, inputNode.type));
        } else {
          throw new Error(`FunctionCallNode: Input '${inputNode.name}' not found in FunctionNode.`);
        }
      }
    }

    const functionName = functionNode.build(builder, 'property');

    return `${functionName}( ${params.join(', ')} )`;
  }
}

class CallCommand extends FunctionCallNode {
  constructor(fn: any, ...parameters: any) {
    parameters = parameters.length > 1 || asNodes(Node.is(parameters[0]) ? parameters : parameters[0]);
    super(asNode(fn), parameters);
  }
}

export const call = nodeProxy(CallCommand);

implCommand('call', CallCommand);
