import type {
  ArrayMap,
  NumberArray,
  NumberArrayConstructor,
  TypedArray,
} from '@modules/renderer/engine/math/MathUtils.js';

export const convertArray = <R extends NumberArrayConstructor>(array: NumberArray, type: R): ArrayMap<R> =>
  ('BYTES_PER_ELEMENT' in type ? new type(array) : Array.from(array)) as ArrayMap<R>;

export const isTypedArray = (object: any): object is TypedArray =>
  ArrayBuffer.isView(object) && !(object instanceof DataView);
