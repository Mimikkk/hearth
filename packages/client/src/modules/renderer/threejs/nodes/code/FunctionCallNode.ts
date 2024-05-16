import TempNode from '../core/TempNode.js';
import { addNodeClass } from '../core/Node.ts';
import { addNodeElement, nodeArray, nodeObject, nodeObjects } from '../shadernode/ShaderNode.js';
import FunctionNode from './FunctionNode.ts';
import NodeBuilder from '@modules/renderer/threejs/nodes/core/NodeBuilder.js';
import { NodeTypeOption } from '@modules/renderer/threejs/nodes/core/constants.js';
import Node from 'three/examples/jsm/nodes/core/Node.js';

class FunctionCallNode extends TempNode {
  constructor(
    public functionNode: FunctionNode,
    public parameters: Record<string, any>,
  ) {
    super();
  }

  getNodeType(builder: NodeBuilder): NodeTypeOption {
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

addNodeClass('FunctionCallNode', FunctionCallNode);
