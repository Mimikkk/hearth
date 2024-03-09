import type { TextSearch } from './textSearch.js';

const calculateScore = (
  pattern: string,
  errors: number,
  currentLocation: number,
  expectedLocation: number,
  distance: number,
) => {
  const accuracy = errors / pattern.length;
  const proximity = Math.abs(expectedLocation - currentLocation);

  return distance ? accuracy + proximity / distance : proximity ? 1.0 : accuracy;
};

const convertMaskToIndices = (mask: number[], minLength: number): [number, number][] => {
  const indices: [number, number][] = [];
  let start = -1;
  let end = -1;
  let i = 0;

  for (let len = mask.length; i < len; ++i) {
    const match = mask[i];

    if (match && start === -1) {
      start = i;
    } else if (!match && start !== -1) {
      end = i - 1;
      if (end - start + 1 >= minLength) indices.push([start, end]);
      start = -1;
    }
  }

  if (mask[i - 1] && i - start >= minLength) indices.push([start, i - 1]);

  return indices;
};

export type SearchResult =
  | { isMatch: false; score: number; indices: undefined }
  | { isMatch: true; score: number; indices: [number, number][] };

export namespace SearchResult {
  export const Match = (score: number, indices: [number, number][]): SearchResult => ({
    isMatch: true,
    score,
    indices,
  });
  export const False = (score: number): SearchResult => ({ isMatch: false, score, indices: undefined });
}

export const search = <T>(
  text: string,
  pattern: string,
  patternMask: PatternMask,
  { distance, threshold, minMatch }: TextSearch.Options<T>,
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

  return bestLocation >= 0
    ? SearchResult.Match(score, convertMaskToIndices(matchMask, minMatch))
    : SearchResult.False(score);
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

export type SearchEngine = (pattern: string) => SearchEngine.Result;

export namespace SearchEngine {
  export const create = <T>(pattern: string, options: TextSearch.Options<T>): SearchEngine => {
    if (!options.sensitive) pattern = pattern.toLowerCase();
    const chunks = Chunk.create(pattern);

    return text => {
      if (!options.sensitive) text = text.toLowerCase();

      if (pattern === text) return { isMatch: true, score: 0, indices: [[0, text.length - 1]] };

      const indices: [number, number][] = [];
      let score = 0;

      for (let i = 0, len = chunks.length; i < len; ++i) {
        const { pattern, mask } = chunks[i];
        const match = search<T>(text, pattern, mask, options);
        score += match.score;

        if (match.isMatch) indices.push(...match.indices);
      }
      score /= chunks.length;

      return indices.length ? Result.Match(score, indices) : Result.False;
    };
  };

  export type Result =
    | { isMatch: false; score: undefined; indices: undefined }
    | { isMatch: true; score: number; indices: [number, number][] };

  export namespace Result {
    export const Match = (score: number, indices: [number, number][]): Result => ({ isMatch: true, score, indices });
    export const False: Result = { isMatch: false, score: undefined, indices: undefined };
  }
}
