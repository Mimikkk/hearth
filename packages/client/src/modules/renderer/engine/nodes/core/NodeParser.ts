import NodeFunction from '@modules/renderer/engine/nodes/core/NodeFunction.js';

export abstract class NodeParser {
  parseFunction(source: string): NodeFunction {
    throw new Error('NodeParser: Not implemented.');
  }
}

export default NodeParser;
