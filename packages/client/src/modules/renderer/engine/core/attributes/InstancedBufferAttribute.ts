import { BufferAttribute } from './BufferAttribute.js';
import { TypedArray } from '../../math/MathUtils.js';

export class InstancedBufferAttribute<T extends TypedArray = any> extends BufferAttribute<T> {
  declare isInstancedBufferAttribute: true;
}

InstancedBufferAttribute.prototype.isInstancedBufferAttribute = true;
