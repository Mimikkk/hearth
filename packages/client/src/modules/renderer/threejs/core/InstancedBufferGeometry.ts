import { BufferGeometry } from './BufferGeometry.js';

export class InstancedBufferGeometry extends BufferGeometry {
  declare ['constructor']: typeof InstancedBufferGeometry & typeof BufferGeometry;
  declare isInstancedBufferGeometry: true;
  instanceCount: number;

  constructor() {
    super();
    this.instanceCount = Infinity;
  }

  copy(source: this): this {
    source = super.copy(source);

    this.instanceCount = source.instanceCount;

    return this;
  }
}
InstancedBufferGeometry.prototype.isInstancedBufferGeometry = true;
InstancedBufferGeometry.prototype.type = 'InstancedBufferGeometry';
