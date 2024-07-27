import type { BufferAttribute } from '@modules/renderer/engine/core/BufferAttribute.js';
import type { TypedArray } from '@modules/renderer/engine/math/MathUtils.js';

export type AttributeType<T extends TypedArray = any> = BufferAttribute<T>;
