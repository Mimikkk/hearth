import { clamp } from '../math/MathUtils.js';

const generateTables = (): {
  floatView: Float32Array;
  uint32View: Uint32Array;
  baseTable: Uint32Array;
  shiftTable: Uint32Array;
  mantissaTable: Uint32Array;
  exponentTable: Uint32Array;
  offsetTable: Uint32Array;
} => {
  const buffer = new ArrayBuffer(4);
  const floatView = new Float32Array(buffer);
  const uint32View = new Uint32Array(buffer);

  const baseTable = new Uint32Array(512);
  const shiftTable = new Uint32Array(512);

  for (let i = 0; i < 256; ++i) {
    const e = i - 127;

    if (e < -27) {
      baseTable[i] = 0x0000;
      baseTable[i | 0x100] = 0x8000;
      shiftTable[i] = 24;
      shiftTable[i | 0x100] = 24;
    } else if (e < -14) {
      baseTable[i] = 0x0400 >> (-e - 14);
      baseTable[i | 0x100] = (0x0400 >> (-e - 14)) | 0x8000;
      shiftTable[i] = -e - 1;
      shiftTable[i | 0x100] = -e - 1;
    } else if (e <= 15) {
      baseTable[i] = (e + 15) << 10;
      baseTable[i | 0x100] = ((e + 15) << 10) | 0x8000;
      shiftTable[i] = 13;
      shiftTable[i | 0x100] = 13;
    } else if (e < 128) {
      baseTable[i] = 0x7c00;
      baseTable[i | 0x100] = 0xfc00;
      shiftTable[i] = 24;
      shiftTable[i | 0x100] = 24;
    } else {
      baseTable[i] = 0x7c00;
      baseTable[i | 0x100] = 0xfc00;
      shiftTable[i] = 13;
      shiftTable[i | 0x100] = 13;
    }
  }

  const mantissaTable = new Uint32Array(2048);
  const exponentTable = new Uint32Array(64);
  const offsetTable = new Uint32Array(64);

  for (let i = 1; i < 1024; ++i) {
    let m = i << 13;
    let e = 0;

    while ((m & 0x00800000) === 0) {
      m <<= 1;
      e -= 0x00800000;
    }

    m &= ~0x00800000;
    e += 0x38800000;

    mantissaTable[i] = m | e;
  }

  for (let i = 1024; i < 2048; ++i) {
    mantissaTable[i] = 0x38000000 + ((i - 1024) << 13);
  }

  for (let i = 1; i < 31; ++i) {
    exponentTable[i] = i << 23;
  }

  exponentTable[31] = 0x47800000;
  exponentTable[32] = 0x80000000;

  for (let i = 33; i < 63; ++i) {
    exponentTable[i] = 0x80000000 + ((i - 32) << 23);
  }

  exponentTable[63] = 0xc7800000;

  for (let i = 1; i < 64; ++i) {
    if (i !== 32) {
      offsetTable[i] = 1024;
    }
  }

  return {
    floatView: floatView,
    uint32View: uint32View,
    baseTable: baseTable,
    shiftTable: shiftTable,
    mantissaTable: mantissaTable,
    exponentTable: exponentTable,
    offsetTable: offsetTable,
  };
};

const tables = generateTables();

export function toHalfFloat(val: number): number {
  if (Math.abs(val) > 65504) console.warn('DataUtils.toHalfFloat(): Value out of range.');
  val = clamp(val, -65504, 65504);

  tables.floatView[0] = val;
  const f = tables.uint32View[0];
  const e = (f >> 23) & 0x1ff;
  return tables.baseTable[e] + ((f & 0x007fffff) >> tables.shiftTable[e]);
}

export function fromHalfFloat(val: number): number {
  const m = val >> 10;
  tables.uint32View[0] = tables.mantissaTable[tables.offsetTable[m] + (val & 0x3ff)] + tables.exponentTable[m];

  return tables.floatView[0];
}

export const DataUtils = {
  toHalfFloat,
  fromHalfFloat,
};
