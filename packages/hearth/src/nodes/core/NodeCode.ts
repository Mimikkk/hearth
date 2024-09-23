import { TypeName } from '../../nodes/builder/NodeBuilder.types.js';

export class NodeCode {
  constructor(
    public name: string,
    public type: TypeName,
    public code: string = '',
  ) {}
}
