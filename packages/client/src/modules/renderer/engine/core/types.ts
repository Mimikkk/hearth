import type { BufferAttribute } from '@modules/renderer/engine/core/attributes/BufferAttribute.js';
import type { InstancedBufferAttribute } from '@modules/renderer/engine/core/attributes/InstancedBufferAttribute.js';
import type { TypedArray } from '@modules/renderer/engine/math/MathUtils.js';
import type { InterleavedBufferAttribute } from '@modules/renderer/engine/core/attributes/InterleavedBufferAttribute.js';

export type AttributeType<T extends TypedArray = any> =
  | BufferAttribute<T>
  | InstancedBufferAttribute<T>
  | InterleavedBufferAttribute<T>;
