import { ArrayMap } from '@modules/renderer/engine/math/MathUtils.js';

const TypedArrayMap = {
  Int8Array,
  Uint8Array,
  Uint8ClampedArray,
  Int16Array,
  Uint16Array,
  Int32Array,
  Uint32Array,
  Float32Array,
  Float64Array,
};

type Map = typeof TypedArrayMap;

export const createTypedArray = <K extends keyof Map>(type: K, elements: ArrayLike<number>): ArrayMap<Map[K]> =>
  new TypedArrayMap[type](elements) as ArrayMap<Map[K]>;
