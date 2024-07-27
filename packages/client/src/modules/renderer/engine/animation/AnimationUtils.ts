import { ArrayMap, NumberArray, TypedArray, TypedArrayConstructor } from '@modules/renderer/engine/math/MathUtils.js';

export const convertArray = <R extends TypedArrayConstructor>(array: NumberArray, type: R): ArrayMap<R> =>
  ('BYTES_PER_ELEMENT' in type ? new type(array) : Array.from(array)) as ArrayMap<R>;

export const isTypedArray = (object: any): object is TypedArray =>
  ArrayBuffer.isView(object) && !(object instanceof DataView);

export function getKeyframeOrder(times: number[]): number[] {
  const n = times.length;

  const result = new Array(n);
  for (let i = 0; i !== n; ++i) result[i] = i;

  return result.sort((i, j) => times[i] - times[j]);
}

export function sortedArray(values: number[], stride: number, order: number[]) {
  const nValues = values.length;
  //@ts-expect-error
  const result = new values.constructor(nValues);

  for (let i = 0, dstOffset = 0; dstOffset !== nValues; ++i) {
    const srcOffset = order[i] * stride;

    for (let j = 0; j !== stride; ++j) {
      result[dstOffset++] = values[srcOffset + j];
    }
  }

  return result;
}

export function flattenJSON(jsonKeys: string[], times: number[], values: number[], valuePropertyName: string) {
  let i = 1,
    key = jsonKeys[0];

  //@ts-expect-error
  while (key !== undefined && key[valuePropertyName] === undefined) {
    key = jsonKeys[i++];
  }
  if (key === undefined) return; // no data

  //@ts-expect-error
  let value = key[valuePropertyName];
  if (value === undefined) return; // no data

  if (Array.isArray(value)) {
    do {
      //@ts-expect-error
      value = key[valuePropertyName];

      if (value !== undefined) {
        //@ts-expect-error
        times.push(key.time);
        values.push.apply(values, value); // push all elements
      }

      key = jsonKeys[i++];
    } while (key !== undefined);
  } else if (value.intoArray !== undefined) {
    // ...assume engine.Math-ish

    do {
      //@ts-expect-error
      value = key[valuePropertyName];

      if (value !== undefined) {
        //@ts-expect-error
        times.push(key.time);
        value.intoArray(values, values.length);
      }

      key = jsonKeys[i++];
    } while (key !== undefined);
  } else {
    // otherwise push as-is

    do {
      //@ts-expect-error
      value = key[valuePropertyName];

      if (value !== undefined) {
        //@ts-expect-error
        times.push(key.time);
        values.push(value);
      }

      key = jsonKeys[i++];
    } while (key !== undefined);
  }
}
