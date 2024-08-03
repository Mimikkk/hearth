import { Node } from './Node.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

export class UniformGroupNode extends Node {
  constructor(
    public name: string,
    public shared: boolean = false,
  ) {
    super(TypeName.string);
    this.version = 0;
  }

  set needsUpdate(value: boolean) {
    if (value) this.version++;
  }
}

export const uniformGroup = (name: string) => new UniformGroupNode(name, false);
export const sharedUniformGroup = (name: string) => new UniformGroupNode(name, true);

export const frameGroup = sharedUniformGroup('frame');
export const renderGroup = sharedUniformGroup('render');
export const objectGroup = uniformGroup('object');

export default UniformGroupNode;
