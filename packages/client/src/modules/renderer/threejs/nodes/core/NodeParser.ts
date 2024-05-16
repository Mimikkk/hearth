import NodeFunction from '@modules/renderer/threejs/nodes/core/NodeFunction.js';

export abstract class NodeParser {
  parseFunction(source: string): NodeFunction {
    throw new Error('NodeParser: Not implemented.');
  }
}

export default NodeParser;
