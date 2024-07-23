export const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

export const euclideanMod = (n: number, m: number): number => ((n % m) + m) % m;

export const lerp = (x: number, y: number, t: number): number => (1 - t) * x + t * y;

export const damp = (x: number, y: number, lambda: number, dt: number): number =>
  lerp(x, y, 1 - Math.exp(-lambda * dt));

export const pingpong = (x: number, length: number = 1): number =>
  length - Math.abs(euclideanMod(x, length * 2) - length);

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
    ? Float32Array
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

export const denormalize = (value: number, array: TypedArray): number => {
  switch (array.constructor) {
    case Float32Array:
      return value;
    case Uint32Array:
      return value / 4294967295.0;
    case Uint16Array:
      return value / 65535.0;
    case Uint8Array:
      return value / 255.0;
    case Int32Array:
      return Math.max(value / 2147483647.0, -1.0);
    case Int16Array:
      return Math.max(value / 32767.0, -1.0);
    case Int8Array:
      return Math.max(value / 127.0, -1.0);
    default:
      throw Error('Invalid component type.');
  }
};

export const normalize = (value: number, array: TypedArray): number => {
  switch (array.constructor) {
    case Float32Array:
      return value;
    case Uint32Array:
      return Math.round(value * 4294967295.0);
    case Uint16Array:
      return Math.round(value * 65535.0);
    case Uint8Array:
      return Math.round(value * 255.0);
    case Int32Array:
      return Math.round(value * 2147483647.0);
    case Int16Array:
      return Math.round(value * 32767.0);
    case Int8Array:
      return Math.round(value * 127.0);
    default:
      throw Error('Invalid component type.');
  }
};
