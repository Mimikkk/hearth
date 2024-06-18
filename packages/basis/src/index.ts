import basis from './basis/basis_transcoder.js';
import string from './basis/basis_transcoder.js?raw';
import buffer from './basis/basis_transcoder.wasm?arraybuffer';

export const CodeString = string satisfies string;
export const WasmBuffer = buffer satisfies ArrayBuffer;
