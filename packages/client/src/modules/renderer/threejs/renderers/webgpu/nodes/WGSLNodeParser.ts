import NodeParser from '../../../nodes/core/NodeParser.js';
import WGSLNodeFunction from './WGSLNodeFunction.ts';

class WGSLNodeParser extends NodeParser {
  parseFunction(source: string): WGSLNodeFunction {
    return new WGSLNodeFunction(source);
  }
}

export default WGSLNodeParser;
