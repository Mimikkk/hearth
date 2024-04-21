import { BufferGeometry } from './BufferGeometry.js';

export class InstancedBufferGeometry extends BufferGeometry {
  declare ['constructor']: typeof InstancedBufferGeometry & typeof BufferGeometry;
  declare isInstancedBufferGeometry: true;
  instanceCount: number;

  constructor() {
    super();
    this.instanceCount = Infinity;
  }

  copy(source: InstancedBufferGeometry): this {
    source = super.copy(source);

    this.instanceCount = source.instanceCount;

    return this;
  }

  toJSON(): any {
    const data = super.toJSON();

    //@ts-expect-error
    data.instanceCount = this.instanceCount;
    //@ts-expect-error
    data.isInstancedBufferGeometry = true;

    return data;
  }
}
InstancedBufferGeometry.prototype.isInstancedBufferGeometry = true;
InstancedBufferGeometry.prototype.type = 'InstancedBufferGeometry';
