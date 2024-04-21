import { BufferAttribute } from './BufferAttribute.js';
import { TypedArray } from '../math/MathUtils.js';

export class InstancedBufferAttribute<T extends TypedArray> extends BufferAttribute<T> {
  declare ['constructor']: typeof InstancedBufferAttribute;
  declare isInstancedBufferAttribute: true;

  constructor(
    array: T,
    itemSize: number,
    normalized: boolean,
    public meshPerAttribute: number = 1,
  ) {
    super(array, itemSize, normalized);
  }

  copy(source: InstancedBufferAttribute<T>): this {
    super.copy(source);
    this.meshPerAttribute = source.meshPerAttribute;

    return this;
  }

  toJSON(): any {
    const data = super.toJSON();
    // @ts-expect-error
    data.meshPerAttribute = this.meshPerAttribute;
    // @ts-expect-error
    data.isInstancedBufferAttribute = true;
    return data;
  }
}
InstancedBufferAttribute.prototype.isInstancedBufferAttribute = true;
