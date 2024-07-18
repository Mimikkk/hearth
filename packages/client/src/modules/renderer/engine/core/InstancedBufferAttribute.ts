import { BufferAttribute } from './BufferAttribute.js';
import { TypedArray } from '../math/MathUtils.js';

export class InstancedBufferAttribute<T extends TypedArray> extends BufferAttribute<T> {
  declare ['constructor']: typeof InstancedBufferAttribute;
  declare isInstancedBufferAttribute: true;

  constructor(
    array: T,
    itemSize: number,
    normalized: boolean = false,
    public meshPerAttribute: number = 1,
  ) {
    super(array, itemSize, normalized);
  }

  copy(source: this): this {
    super.copy(source);
    this.meshPerAttribute = source.meshPerAttribute;

    return this;
  }
}
InstancedBufferAttribute.prototype.isInstancedBufferAttribute = true;
