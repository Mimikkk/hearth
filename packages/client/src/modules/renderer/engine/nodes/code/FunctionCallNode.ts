import TempNode from '../core/TempNode.js';
import { addNodeElement, nodeArray, nodeObject, nodeObjects } from '../shadernode/ShaderNodes.js';
import FunctionNode from './FunctionNode.ts';
import { NodeBuilder } from '@modules/renderer/engine/renderers/webgpu/nodes/NodeBuilder.js';

import { ONodeType } from '@modules/renderer/engine/nodes/core/constants.js';

class FunctionCallNode extends TempNode {
  static type = 'FunctionCallNode';

  constructor(
    public functionNode: FunctionNode,
    public parameters: Record<string, any>,
  ) {
    super();
  }

  getNodeType(builder: NodeBuilder): ONodeType {
    return this.functionNode.getNodeType(builder);
  }

  generate(builder: NodeBuilder): string {
    const params = [];

    const functionNode = this.functionNode;

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

export default FunctionCallNode;

export const call = (func: any, ...params: any) => {
  params = params.length > 1 || (params[0] && params[0].isNode === true) ? nodeArray(params) : nodeObjects(params[0]);

  return nodeObject(new FunctionCallNode(nodeObject(func), params));
};

addNodeElement('call', call);
