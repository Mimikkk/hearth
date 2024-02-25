import type { Searcher } from '@logic/searcher/searcher.js';

const calculateScore = (
  pattern: string,
  errors: number,
  currentLocation: number,
  expectedLocation: number,
  distance: number,
) => {
  const accuracy = errors / pattern.length;

  const proximity = Math.abs(expectedLocation - currentLocation);

  if (!distance) return proximity ? 1.0 : accuracy;

  return accuracy + proximity / distance;
};

const convertMaskToIndices = (mask: number[], minLength: number): [number, number][] => {
  const indices: [number, number][] = [];
  let start = -1;
  let end = -1;
  let i = 0;

  for (let len = mask.length; i < len; ++i) {
    let match = mask[i];
    if (match && start === -1) {
      start = i;
    } else if (!match && start !== -1) {
      end = i - 1;
      if (end - start + 1 >= minLength) {
        indices.push([start, end]);
      }
      start = -1;
    }
  }

  if (mask[i - 1] && i - start >= minLength) {
    indices.push([start, i - 1]);
  }

  return indices;
};

export type SearchResult =
  | { isMatch: false; score: number; indices: undefined }
  | { isMatch: true; score: number; indices: [number, number][] };

export const search = (
  text: string,
  pattern: string,
  patternMask: PatternMask,
  { distance, threshold, minMatchSize }: Searcher.Options,
): SearchResult => {
  const patternLen = pattern.length;
  const textLen = text.length;
  const expectedLocation = Math.max(0, Math.min(0, textLen));
  let currentThreshold = threshold;
  let bestLocation = expectedLocation;
  const matchMask: number[] = Array(textLen);

  let index;
  while ((index = text.indexOf(pattern, bestLocation)) > -1) {
    const score = calculateScore(pattern, 0, index, expectedLocation, distance);

    currentThreshold = Math.min(score, currentThreshold);
    bestLocation = index + patternLen;

    let i = 0;
    while (i < patternLen) {
      matchMask[index + i] = 1;
      ++i;
    }
  }
  bestLocation = -1;

  let lastBitArr = [];
  let finalScore = 1;
  let binMax = patternLen + textLen;

  const mask = 1 << (patternLen - 1);
  for (let i = 0; i < patternLen; ++i) {
    let binMin = 0;
    let binMid = binMax;

    while (binMin < binMid) {
      const score = calculateScore(pattern, i, expectedLocation + binMid, expectedLocation, distance);

      if (score <= currentThreshold) {
        binMin = binMid;
      } else {
        binMax = binMid;
      }

      binMid = Math.floor((binMax - binMin) / 2 + binMin);
    }

    binMax = binMid;

    let start = Math.max(1, expectedLocation - binMid + 1);
    let finish = Math.min(expectedLocation + binMid, textLen) + patternLen;

    let bitArr = Array(finish + 2);

    bitArr[finish + 1] = (1 << i) - 1;

    for (let j = finish; j >= start; j -= 1) {
      let currentLocation = j - 1;
      let charMatch = patternMask.get(text[currentLocation])!;

      matchMask[currentLocation] = +!!charMatch;

      bitArr[j] = ((bitArr[j + 1] << 1) | 1) & charMatch;
      if (i) bitArr[j] |= ((lastBitArr[j + 1] | lastBitArr[j]) << 1) | 1 | lastBitArr[j + 1];

      if (bitArr[j] & mask) {
        finalScore = calculateScore(pattern, i, currentLocation, expectedLocation, distance);

        if (finalScore <= currentThreshold) {
          currentThreshold = finalScore;
          bestLocation = currentLocation;
          if (bestLocation <= expectedLocation) break;
          start = Math.max(1, 2 * expectedLocation - bestLocation);
        }
      }
    }

    const score = calculateScore(pattern, i + 1, expectedLocation, expectedLocation, distance);

    if (score > currentThreshold) {
      break;
    }

    lastBitArr = bitArr;
  }

  const score = Math.max(0.001, finalScore);

  const isMatch = bestLocation >= 0;
  return isMatch
    ? { isMatch, score, indices: convertMaskToIndices(matchMask, minMatchSize) }
    : { isMatch, score, indices: undefined };
};

export type PatternMask = Map<string, number>;

export namespace PatternMask {
  export const create = (pattern: string): PatternMask => {
    const mask = new Map();

    for (let i = 0, len = pattern.length; i < len; ++i) {
      const char = pattern[i];

      mask.set(char, (mask.get(char) ?? 0) | (1 << (len - i - 1)));
    }

    return mask;
  };
}

export interface Chunk {
  pattern: string;
  mask: PatternMask;
  startIndex: number;
}

export namespace Chunk {
  const single = (pattern: string, startIndex: number): Chunk => ({
    pattern,
    mask: PatternMask.create(pattern),
    startIndex,
  });
  const MaxSize = 32;

  export const create = (pattern: string): Chunk[] => {
    const chunks = [];

    const len = pattern.length;
    if (len > MaxSize) {
      let i = 0;
      const remainder = len % MaxSize;
      const end = len - remainder;

      while (i < end) {
        chunks.push(single(pattern.substring(i, MaxSize), i));
        i += MaxSize;
      }

      if (remainder) {
        const startIndex = len - MaxSize;
        chunks.push(single(pattern.substring(startIndex), startIndex));
      }
    } else if (len > 0) {
      chunks.push(single(pattern, 0));
    }

    return chunks;
  };
}

export class SearchEngine {
  pattern: string;
  options: Searcher.Options;
  chunks: Chunk[];

  constructor(pattern: string, options: Searcher.Options) {
    this.options = options;
    this.pattern = this.options.isCaseSensitive ? pattern : pattern.toLowerCase();
    this.chunks = Chunk.create(pattern);
  }

  searchIn(text: string): SearchEngine.InResult {
    if (!this.options.isCaseSensitive) text = text.toLowerCase();
    if (this.pattern === text) return { isMatch: true, score: 0, indices: [[0, text.length - 1]] };

    const indices: [number, number][] = [];
    let score = 0;
    let isMatch = false;

    for (let i = 0, len = this.chunks.length; i < len; ++i) {
      const { pattern, mask } = this.chunks[i];
      const match = search(text, pattern, mask, this.options);

      score += match.score;
      if (match.isMatch) {
        isMatch = true;
        indices.push(...match.indices);
      }
    }

    score /= this.chunks.length;

    return isMatch ? { isMatch, score, indices } : { isMatch, score: undefined, indices: undefined };
  }
}

export namespace SearchEngine {
  export type InResult =
    | { isMatch: false; score: undefined; indices: undefined }
    | { isMatch: true; score: number; indices: [number, number][] };
}
