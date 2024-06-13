import NodeFunctionInput from '@modules/renderer/engine/nodes/core/NodeFunctionInput.js';

export abstract class NodeFunction {
  protected constructor(
    public type: string,
    public inputs: NodeFunctionInput[],
    public name: string = '',
    public presicion: string = '',
  ) {}

  getCode(name: string) {
    throw new Error('NodeFunction: getCode is not implemented.');
  }
}

export default NodeFunction;
