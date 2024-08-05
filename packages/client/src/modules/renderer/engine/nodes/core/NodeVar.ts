import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

export class NodeVar {
  declare isNodeVar: true;

  constructor(
    public name: string,
    public type: TypeName,
  ) {}
}

NodeVar.prototype.isNodeVar = true;
