import { STD140ChunkBytes } from './constants.js';

export function getFloatLength(floatLength: number): number {
  // ensure chunk size alignment (STD140 layout)

  return floatLength + ((STD140ChunkBytes - (floatLength % STD140ChunkBytes)) % STD140ChunkBytes);
}

export function getVectorLength(count: number, vectorLength: number = 4): number {
  const strideLength = getStrideLength(vectorLength);

  const floatLength = strideLength * count;

  return getFloatLength(floatLength);
}

export function getStrideLength(vectorLength: number): number {
  const strideLength = 4;

  return vectorLength + ((strideLength - (vectorLength % strideLength)) % strideLength);
}
