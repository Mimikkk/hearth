import { NodeVar } from './NodeVar.js';

export class NodeVarying extends NodeVar {
  needsInterpolation = false;
  isNodeVarying = true;

  constructor(name: string, type: string) {
    super(name, type);

    this.needsInterpolation = false;
    this.isNodeVarying = true;
  }
}

export default NodeVarying;
