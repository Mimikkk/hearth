export const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

export const euclideanMod = (n: number, m: number): number => ((n % m) + m) % m;

export const lerp = (x: number, y: number, t: number): number => (1 - t) * x + t * y;

export const smoothstep = (x: number, min: number, max: number): number => {
  if (x <= min) return 0;
  if (x >= max) return 1;

  x = (x - min) / (max - min);

  return x * x * (3 - 2 * x);
};

export const DegreeToRadian = Math.PI / 180;
export const degreeToRadian = (degrees: number): number => degrees * DegreeToRadian;

export const RadianToDegree = 180 / Math.PI;
export const radianToDegree = (radians: number): number => radians * RadianToDegree;

export type TypedArray =
  | Float64Array
  | Float32Array
  | Uint32Array
  | Uint16Array
  | Uint8Array
  | Int32Array
  | Int16Array
  | Int8Array
  | Uint8ClampedArray;

export type NumberArray = number[] | TypedArray;

export type TypedArrayConstructor =
  | Float64ArrayConstructor
  | Float32ArrayConstructor
  | Uint32ArrayConstructor
  | Uint16ArrayConstructor
  | Uint8ArrayConstructor
  | Int32ArrayConstructor
  | Int16ArrayConstructor
  | Uint8ClampedArrayConstructor
  | Int8ArrayConstructor;

export type NumberArrayConstructor = ArrayConstructor | TypedArrayConstructor;

export type ArrayConstructorMap<T extends NumberArray> = [T] extends [number[]]
  ? ArrayConstructor
  : [T] extends [Float32Array]
    ? Float64ArrayConstructor
    : [T] extends [Float32Array]
      ? Float32ArrayConstructor
      : [T] extends [Uint32Array]
        ? Uint32ArrayConstructor
        : [T] extends [Uint16Array]
          ? Uint16ArrayConstructor
          : [T] extends [Uint8Array]
            ? Uint8ArrayConstructor
            : [T] extends [Int32Array]
              ? Int32ArrayConstructor
              : [T] extends [Int16Array]
                ? Int16ArrayConstructor
                : [T] extends [Int8Array]
                  ? Int8ArrayConstructor
                  : [T] extends [Uint8ClampedArray]
                    ? Uint8ClampedArrayConstructor
                    : never;

export type ArrayMap<T extends NumberArrayConstructor> = T extends ArrayConstructor
  ? number[]
  : T extends Float64ArrayConstructor
    ? Float64Array
    : T extends Float32ArrayConstructor
      ? Float32Array
      : T extends Uint32ArrayConstructor
        ? Uint32Array
        : T extends Uint16ArrayConstructor
          ? Uint16Array
          : T extends Uint8ArrayConstructor
            ? Uint8Array
            : T extends Int32ArrayConstructor
              ? Int32Array
              : T extends Int16ArrayConstructor
                ? Int16Array
                : T extends Int8ArrayConstructor
                  ? Int8Array
                  : T extends Uint8ClampedArrayConstructor
                    ? Uint8ClampedArray
                    : never;

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
export const createTypedArray = <K extends keyof Map>(type: K, elements: NumberArray | number): ArrayMap<Map[K]> =>
  new TypedArrayMap[type](elements as number) as ArrayMap<Map[K]>;

export const createTypedArrayAs = <T extends TypedArray>(array: T, elements: NumberArray | number): T =>
  createTypedArray(array.constructor as any, elements) as T;
