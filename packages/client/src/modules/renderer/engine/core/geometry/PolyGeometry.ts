import { Geometry } from './Geometry.js';

export class PolyGeometry extends Geometry {
  declare isInstancedBufferGeometry: true;
  instanceCount: number;

  constructor() {
    super();
    this.instanceCount = Infinity;
  }

  static is(value: any): value is PolyGeometry {
    return value?.isInstancedBufferGeometry === true;
  }

  copy(source: this): this {
    source = super.copy(source);

    this.instanceCount = source.instanceCount;

    return this;
  }
}
PolyGeometry.prototype.isInstancedBufferGeometry = true;
PolyGeometry.prototype.type = 'InstancedBufferGeometry';
