import { TypedArray } from '../../math/MathUtils.js';
import { BufferAttribute } from '@modules/renderer/engine/core/attributes/BufferAttribute.js';

export class InterleavedBufferAttribute<T extends TypedArray = any> extends BufferAttribute<T> {
  declare isInterleavedBufferAttribute: true;
}

InterleavedBufferAttribute.prototype.isInterleavedBufferAttribute = true;
