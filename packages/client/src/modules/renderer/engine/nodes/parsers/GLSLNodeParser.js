import NodeParser from '../core/NodeParser.ts';
import GLSLNodeFunction from './GLSLNodeFunction.js';

class GLSLNodeParser extends NodeParser {
  parseFunction(source) {
    return new GLSLNodeFunction(source);
  }
}

export default GLSLNodeParser;
