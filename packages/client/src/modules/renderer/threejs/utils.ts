export const isArrayUint32 = (array: ArrayLike<number>): boolean => {
  // assumes larger values usually on last

  for (let i = array.length - 1; i >= 0; --i) {
    // account for PRIMITIVE_RESTART_FIXED_INDEX, #24565
    if (array[i] >= 65535) return true;
  }

  return false;
};

const TypedArrayMap = {
  Int8Array: Int8Array,
  Uint8Array: Uint8Array,
  Uint8ClampedArray: Uint8ClampedArray,
  Int16Array: Int16Array,
  Uint16Array: Uint16Array,
  Int32Array: Int32Array,
  Uint32Array: Uint32Array,
  Float32Array: Float32Array,
  Float64Array: Float64Array,
};

export const createTypedArray = (type: keyof typeof TypedArrayMap, buffer: ArrayLike<number>) =>
  new TypedArrayMap[type](buffer);

export const createElementNS = (name: string) => document.createElementNS('http://www.w3.org/1999/xhtml', name);

export const createCanvasElement = (): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.style.display = 'block';

  return canvas;
};
