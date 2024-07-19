import NodeParser from '../../../nodes/core/NodeParser.js';
import WGSLNodeFunction from './WGSLNodeFunction.js';

class WGSLNodeParser extends NodeParser {
  parseFunction(source: string): WGSLNodeFunction {
    return new WGSLNodeFunction(source);
  }
}

export default WGSLNodeParser;
