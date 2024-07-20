import Node from './Node.ts';

class StructTypeNode extends Node {
  static type = 'StructTypeNode';

  constructor(types) {
    super();

    this.types = types;
    this.isStructTypeNode = true;
  }

  getMemberTypes() {
    return this.types;
  }
}

export default StructTypeNode;
