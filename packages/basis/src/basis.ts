import { makeBasis } from './basis/basis_transcoder.js';

export interface KTX2File {
  isValid(): boolean;

  isUASTC(): boolean;

  getWidth(): number;

  getHeight(): number;

  getLayers(): number | undefined;

  getLevels(): number;

  getFaces(): number;

  getHasAlpha(): boolean;

  getDFDFlags(): number;

  startTranscoding(): boolean;

  getImageLevelInfo(
    mip: number,
    layer: number,
    face: number,
  ): {
    width: number;
    height: number;
    origWidth: number;
    origHeight: number;
  };

  getImageTranscodedSizeInBytes(mip: number, layer: number, face: number, format: number): number;

  transcodeImage(
    dst: Uint8Array,
    mip: number,
    layer: number,
    face: number,
    format: number,
    unused: number,
    unused2: number,
    unused3: number,
  ): boolean;

  close(): void;

  delete(): void;
}

export interface Basis {
  KTX2File: new (array: Uint8Array) => KTX2File;
}

export const createBasis: () => Promise<Basis> = makeBasis as any;
