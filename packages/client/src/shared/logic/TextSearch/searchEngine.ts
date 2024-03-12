import type { TextSearch } from '@logic/TextSearch/textSearch.js';

export type SearchEngine = (query: string) => SearchEngine.Match;

export namespace SearchEngine {
  export const create = <T>(query: string, configuration: TextSearch.Configuration<T>): SearchEngine => {
    if (!configuration.sensitive) query = query.toLowerCase();
    const chunks = Chunk.create(query);

    return text => {
      if (!configuration.sensitive) text = text.toLowerCase();
      if (query === text) return { isMatch: true, score: 0, indices: [[0, text.length - 1]] };

      const indices: [number, number][] = [];
      let score = 0;

      for (const chunk of chunks) {
        const match = search(text, chunk, configuration);
        score += match.score;

        if (match.isMatch) indices.push(...match.indices);
      }
      score /= chunks.length;

      return indices.length
        ? { isMatch: true, score, indices }
        : { isMatch: false, score: undefined, indices: undefined };
    };
  };

  const calculateScore = (
    query: string,
    errors: number,
    currentLocation: number,
    expectedLocation: number,
    distance: number,
  ) => {
    const accuracy = errors / query.length;
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

  type ChunkMatch =
    | { isMatch: false; score: number; indices: undefined }
    | { isMatch: true; score: number; indices: [number, number][] };

  const search = <T>(
    query: string,
    { text, mask }: Chunk,
    { distance, threshold, minMatch }: TextSearch.Configuration<T>,
  ): ChunkMatch => {
    const queryLen = text.length;
    const valueLen = query.length;
    const expectedLocation = Math.max(0, Math.min(0, valueLen));
    let currentThreshold = threshold;
    let bestLocation = expectedLocation;
    const matchMask: number[] = Array(valueLen);

    let index;
    while ((index = query.indexOf(text, bestLocation)) > -1) {
      const score = calculateScore(text, 0, index, expectedLocation, distance);

      currentThreshold = Math.min(score, currentThreshold);
      bestLocation = index + queryLen;

      let i = 0;
      while (i < queryLen) {
        matchMask[index + i] = 1;
        ++i;
      }
    }
    bestLocation = -1;

    let lastBitArr = [];
    let finalScore = 1;
    let binMax = queryLen + valueLen;

    const textMask = 1 << (queryLen - 1);
    for (let i = 0; i < queryLen; ++i) {
      let binMin = 0;
      let binMid = binMax;

      while (binMin < binMid) {
        const score = calculateScore(text, i, expectedLocation + binMid, expectedLocation, distance);

        if (score <= currentThreshold) {
          binMin = binMid;
        } else {
          binMax = binMid;
        }

        binMid = Math.floor((binMax - binMin) / 2 + binMin);
      }

      binMax = binMid;

      let start = Math.max(1, expectedLocation - binMid + 1);
      let finish = Math.min(expectedLocation + binMid, valueLen) + queryLen;

      let bitArr = Array(finish + 2);

      bitArr[finish + 1] = (1 << i) - 1;

      for (let j = finish; j >= start; j -= 1) {
        let currentLocation = j - 1;
        let charMatch = mask.get(query[currentLocation])!;

        matchMask[currentLocation] = +!!charMatch;

        bitArr[j] = ((bitArr[j + 1] << 1) | 1) & charMatch;
        if (i) bitArr[j] |= ((lastBitArr[j + 1] | lastBitArr[j]) << 1) | 1 | lastBitArr[j + 1];

        if (bitArr[j] & textMask) {
          finalScore = calculateScore(text, i, currentLocation, expectedLocation, distance);

          if (finalScore <= currentThreshold) {
            currentThreshold = finalScore;
            bestLocation = currentLocation;
            if (bestLocation <= expectedLocation) break;
            start = Math.max(1, 2 * expectedLocation - bestLocation);
          }
        }
      }

      const score = calculateScore(text, i + 1, expectedLocation, expectedLocation, distance);

      if (score > currentThreshold) {
        break;
      }

      lastBitArr = bitArr;
    }

    const score = Math.max(0.001, finalScore);

    return bestLocation >= 0
      ? { isMatch: true, score, indices: convertMaskToIndices(matchMask, minMatch) }
      : { isMatch: false, score, indices: undefined };
  };

  export type Match =
    | { isMatch: false; score: undefined; indices: undefined }
    | { isMatch: true; score: number; indices: [number, number][] };

  type QueryMask = Map<string, number>;

  namespace QueryMask {
    export const create = (query: string): QueryMask => {
      const mask = new Map();

      for (let i = 0, len = query.length; i < len; ++i) {
        const char = query[i];

        mask.set(char, (mask.get(char) ?? 0) | (1 << (len - i - 1)));
      }

      return mask;
    };
  }

  interface Chunk {
    text: string;
    mask: QueryMask;
    startIndex: number;
  }

  namespace Chunk {
    const single = (query: string, startIndex: number): Chunk => ({
      text: query,
      mask: QueryMask.create(query),
      startIndex,
    });
    const MaxSize = 32;

    export const create = (query: string): Chunk[] => {
      const chunks = [];

      const len = query.length;
      if (len > MaxSize) {
        let i = 0;
        const remainder = len % MaxSize;
        const end = len - remainder;

        while (i < end) {
          chunks.push(single(query.substring(i, MaxSize), i));
          i += MaxSize;
        }

        if (remainder) {
          const startIndex = len - MaxSize;
          chunks.push(single(query.substring(startIndex), startIndex));
        }
      } else if (len > 0) {
        chunks.push(single(query, 0));
      }

      return chunks;
    };
  }
}
