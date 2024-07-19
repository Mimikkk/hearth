import type { BufferAttribute } from '@modules/renderer/engine/core/BufferAttribute.js';
import type { InstancedBufferAttribute } from '@modules/renderer/engine/core/InstancedBufferAttribute.js';
import type { TypedArray } from '@modules/renderer/engine/math/MathUtils.js';
import { InterleavedBufferAttribute } from '@modules/renderer/engine/core/InterleavedBufferAttribute.js';
import { InterleavedBuffer } from '@modules/renderer/engine/core/InterleavedBuffer.js';

export type Attribute<T extends TypedArray = any> =
  | BufferAttribute<T>
  | InstancedBufferAttribute<T>
  | InterleavedBufferAttribute<T>;

export type Buffer<T extends TypedArray = any> =
  | InterleavedBuffer<T>
  | BufferAttribute<T>
  | InstancedBufferAttribute<T>;
