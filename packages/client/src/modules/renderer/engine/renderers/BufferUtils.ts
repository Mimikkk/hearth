import { STD140ChunkBytes } from './constants.js';

export function getFloatLength(floatLength: number): number {
  return floatLength + ((STD140ChunkBytes - (floatLength % STD140ChunkBytes)) % STD140ChunkBytes);
}
