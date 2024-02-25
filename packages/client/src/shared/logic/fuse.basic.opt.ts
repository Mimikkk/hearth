type SortFn<T> = (a: SearchResult<T>, b: SearchResult<T>) => number;
const sortFn = <T>(a: SearchResult<T>, b: SearchResult<T>) =>
  a.score === b.score ? (a.index < b.index ? -1 : 1) : a.score < b.score ? -1 : 1;

type GetFn<T> = (obj: T, path: string | string[]) => string | string[];
const getFn = <T>(obj: T, path: string | string[]) => {
  const items: string[] = [];
  let isArray = false;

  const recurse = (obj: any, path: string[], depth: number): any => {
    if (!path[depth]) {
      items.push(obj);
    } else {
      const key = path[depth];
      const value = obj[key];

      const type = typeof value;
      if (depth === path.length - 1 && (type === 'string' || type === 'number' || type === 'boolean')) {
        items.push(`${value}`);
      } else if (Array.isArray(value)) {
        isArray = true;

        for (let i = 0, len = value.length; i < len; i += 1) recurse(value[i], path, depth + 1);
      } else if (path.length) {
        recurse(value, path, depth + 1);
      }
    }
  };

  recurse(obj, typeof path === 'string' ? path.split('.') : path, 0);

  return isArray ? items : items[0];
};

const SpaceRegex = /[^ ]+/g;

interface NormFn {
  (value: string): number;
  clear(): void;
}
const normFn = (weight: number, mantissa: number): NormFn => {
  const cache = new Map();
  const m = Math.pow(10, mantissa);

  const normalize = (value: string): number => {
    const numTokens = value.match(SpaceRegex)?.length ?? 0;

    let n = cache.get(numTokens);
    if (n !== undefined) return n;
    const norm = 1 / Math.pow(numTokens, 0.5 * weight);
    n = +(Math.round(norm * m) / m);
    cache.set(numTokens, n);
    return n;
  };
  normalize.clear = () => cache.clear();

  return normalize;
};

interface IndexKey<T> {
  path: string | string[];
  id: string;
  weight: number;
  src: string | string[];
  getFn?: ((obj: T) => string | string[]) | null;
}

namespace IndexKey {
  const createPath = (key: string | string[]): string[] => (Array.isArray(key) ? key : key.split('.'));

  const keyId = (key: string | string[]): string => (Array.isArray(key) ? key.join('.') : key);

  export const create = <T>(key: SearchKey<T>): IndexKey<T> => {
    if (typeof key === 'string' || Array.isArray(key)) {
      return {
        path: createPath(key),
        id: keyId(key),
        weight: 1,
        src: key,
      };
    }

    return {
      path: createPath(key.name),
      id: keyId(key.name),
      weight: key.weight ?? 1,
      src: key.name,
      getFn: key.access,
    };
  };
}

interface SearchRecordString {
  value: string;
  index: number;
  norm: number;
}

interface SearchRecordObject {
  index: number;
  children: (SearchRecordString[] | { value: string; norm: number })[];
}

type SearchRecord = SearchRecordString | SearchRecordObject;

class SearchIndex<T> {
  records: SearchRecord[];
  keys: IndexKey<T>[];
  #norm: NormFn;
  #get: GetFn<T>;
  docs: T[];

  constructor(docs: T[], keys: SearchKey<T>[], options: Searcher.Options<T>) {
    this.#norm = normFn(1, 3);
    this.#get = options.accessFn;

    this.records = [];
    this.keys = keys.map(IndexKey.create);
    this.docs = docs;

    const method = typeof this.docs[0] === 'string' ? this._createString : this._createObject;
    for (let i = 0, it = this.docs.length; i < it; ++i) this.records.push(method.call(this, this.docs[i], i));
    this.#norm.clear();
  }

  _createString(value: string, index: number): SearchRecordString {
    return { value, index, norm: this.#norm(value) };
  }

  _createObject(doc: T, index: number): SearchRecordObject {
    const record: SearchRecordObject = { index, children: [] };

    for (let i = 0, len = this.keys.length; i < len; ++i) {
      const key = this.keys[i];
      const value = key.getFn?.(doc) ?? this.#get(doc, key.path);

      if (typeof value === 'string') {
        record.children.push({ value: value, norm: this.#norm(value) });
      } else if (Array.isArray(value)) {
        const records = [];
        type Item = [number, string | string[]];
        const stack: Item[] = [[-1, value]];

        while (stack.length) {
          const [k, value] = stack.pop()!;

          if (typeof value === 'string') {
            records.push({ value, index: k, norm: this.#norm(value) });
          } else if (Array.isArray(value)) {
            stack.push(...value.map((value, k) => [k, value] as Item));
          }
        }

        record.children.push(records);
      }
    }

    return record;
  }
}

interface ComputeScoreOptions {
  errors: number;
  currentLocation: number;
  expectedLocation: number;
  distance: number;
}

const computeScore$1 = (
  pattern: string,
  { errors, currentLocation, expectedLocation, distance }: ComputeScoreOptions,
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

const search = (
  text: string,
  pattern: string,
  patternMask: SearchEngine.PatternMask,
  { distance, threshold, minMatchCharLength }: SearchEngine.Options,
): SearchEngine.Result => {
  const patternLen = pattern.length;
  const textLen = text.length;
  const expectedLocation = Math.max(0, Math.min(0, textLen));
  let currentThreshold = threshold;
  let bestLocation = expectedLocation;
  const matchMask: number[] = Array(textLen);

  let index;
  while ((index = text.indexOf(pattern, bestLocation)) > -1) {
    const score = computeScore$1(pattern, {
      errors: 0,
      currentLocation: index,
      expectedLocation,
      distance,
    });

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
      const score = computeScore$1(pattern, {
        errors: i,
        currentLocation: expectedLocation + binMid,
        expectedLocation,
        distance,
      });

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
        finalScore = computeScore$1(pattern, {
          errors: i,
          currentLocation,
          expectedLocation,
          distance,
        });

        if (finalScore <= currentThreshold) {
          currentThreshold = finalScore;
          bestLocation = currentLocation;
          if (bestLocation <= expectedLocation) break;
          start = Math.max(1, 2 * expectedLocation - bestLocation);
        }
      }
    }

    const score = computeScore$1(pattern, {
      errors: i + 1,
      currentLocation: expectedLocation,
      expectedLocation,
      distance,
    });

    if (score > currentThreshold) {
      break;
    }

    lastBitArr = bitArr;
  }

  const score = Math.max(0.001, finalScore);

  const isMatch = bestLocation >= 0;
  return isMatch
    ? { isMatch, score, indices: convertMaskToIndices(matchMask, minMatchCharLength) }
    : { isMatch, score, indices: undefined };
};

class SearchEngine {
  pattern: string;
  options: SearchEngine.Options;
  chunks: SearchEngine.Chunk[];

  constructor(pattern: string, options: SearchEngine.Options) {
    this.options = options;
    this.pattern = this.options.isCaseSensitive ? pattern : pattern.toLowerCase();
    this.chunks = SearchEngine.Chunk.create(pattern);
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

namespace SearchEngine {
  export interface Options {
    threshold: number;
    distance: number;
    minMatchCharLength: number;
    isCaseSensitive: boolean;
  }

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
    const single = (pattern: string, startIndex: number): SearchEngine.Chunk => ({
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

  export type Result =
    | { isMatch: false; score: number; indices: undefined }
    | { isMatch: true; score: number; indices: [number, number][] };

  export type InResult =
    | { isMatch: false; score: undefined; indices: undefined }
    | { isMatch: true; score: number; indices: [number, number][] };
}

const computeScore = <T>(results: SearchResult<T>[]): void => {
  for (let i = 0, it = results.length; i < it; ++i) {
    const result = results[i];
    let totalScore = 1;

    for (let j = 0, len = result.matches.length; j < len; ++j) {
      const { key, norm, score } = result.matches[j];

      totalScore *= Math.pow(score === 0 && key ? Number.EPSILON : score, (key?.weight || 1) * norm);
    }

    result.score = totalScore;
  }
};

interface TransformedMatch {
  key?: string | string[];
  norm: number;
  score: number;
  indices?: [number, number][];
  value: string;
  refIndex?: number;
}

namespace TransformedMatch {
  export const single = <T>({ indices, value, key, index }: Match<T>): TransformedMatch => {
    const match: TransformedMatch = {
      key: undefined,
      norm: 0,
      score: 0,
      indices,
      value,
    };

    if (key) match.key = key.src;

    if (index! > -1) match.refIndex = index;

    return match;
  };

  export const create = <T>(matches: Match<T>[]): TransformedMatch[] => matches.map(single);
}

interface FormattedSearchResult<T> {
  item: T;
  index: number;
  matches: TransformedMatch[];
  score: number;
}

namespace FormattedSearchResult {
  export const create = <T>(results: SearchResult<T>[], items: T[]): FormattedSearchResult<T>[] =>
    results.map(({ index, matches, score }) => ({
      item: items[index],
      matches: TransformedMatch.create(matches),
      score,
      index,
    }));
}

interface Match<T> {
  score: number;
  key?: IndexKey<T>;
  value: string;
  norm: number;
  indices?: [number, number][];
  index?: number;
}

interface SearchResult<T> {
  index: number;
  score: number;
  record: SearchRecordObject['children'][number] | SearchRecordObject['children'] | string;
  matches: Match<T>[];
}

type SearchKey<T> =
  | string
  | string[]
  | { name: string | string[]; weight?: number; access?: (obj: T) => string | string[] };

export class Searcher<T> {
  options: Searcher.Options<T>;
  #index: SearchIndex<T>;
  #items: T[];

  constructor(items: T[], options?: Partial<Searcher.Options<T>>) {
    this.options = {
      accessFn: options?.accessFn ?? getFn,
      keys: options?.keys ?? [],
      minMatchCharLength: options?.minMatchCharLength ?? 1,
      sortFn: options?.sortFn ?? sortFn,
      threshold: options?.threshold ?? 0.6,
      distance: options?.distance ?? 100,
      isCaseSensitive: options?.isCaseSensitive ?? false,
    };
    this.items = items;
  }

  get items(): T[] {
    return this.#items;
  }

  set items(items: T[]) {
    this.#items = items;
    this.#index = new SearchIndex(this.#items, this.options.keys, this.options);
  }

  search(query: string, options?: Partial<Searcher.SearchOptions>): FormattedSearchResult<T>[] {
    let results = typeof this.#items[0] === 'string' ? this.#searchString(query) : this.#searchObject(query);

    computeScore(results);

    if (this.options.sortFn) results.sort(this.options.sortFn);
    if (options?.limit) results = results.slice(0, options.limit);

    return FormattedSearchResult.create(results, this.#items);
  }

  #searchString(query: string): SearchResult<T>[] {
    const searcher = new SearchEngine(query, this.options);
    const { records } = this.#index;
    const results: SearchResult<T>[] = [];

    for (let i = 0, len = records.length; i < len; ++i) {
      const { value: record, index: index, norm: norm } = records[i] as SearchRecordString;
      const { isMatch, score, indices } = searcher.searchIn(record);

      if (isMatch) results.push({ record, index, matches: [{ score, value: record, norm, indices }], score: 0 });
    }

    return results;
  }

  #searchObject(query: string): SearchResult<T>[] {
    const searcher = new SearchEngine(query, this.options);
    const { keys, records } = this.#index;
    const results: SearchResult<T>[] = [];

    for (let i = 0, len = records.length; i < len; ++i) {
      const { children: record, index: index } = (records as SearchRecordObject[])[i];

      let matches: Match<T>[] = [];

      for (let j = 0, len = keys.length; j < len; ++j) {
        matches.push(...this.#findMatches({ key: keys[j], record: record[j], searcher }));
      }

      if (matches.length) results.push({ index, record, matches, score: 0 });
    }

    return results;
  }

  #findMatches({
    key,
    record,
    searcher,
  }: {
    key: IndexKey<T>;
    record: SearchResult<T>['record'];
    searcher: SearchEngine;
  }): Match<T>[] {
    const matches: Match<T>[] = [];

    if (Array.isArray(record)) {
      for (let index = 0, len = record.length; index < len; ++index) {
        const { value, norm } = record[index] as SearchRecordString;
        const { isMatch, score, indices } = searcher.searchIn(value);

        if (isMatch) matches.push({ score, key, value, index, norm, indices });
      }
    } else {
      const { value, norm } = record as SearchRecordString;
      const { isMatch, score, indices } = searcher.searchIn(value);

      if (isMatch) matches.push({ score, key, value, norm, indices });
    }

    return matches;
  }
}

export namespace Searcher {
  export interface Options<T = unknown> {
    threshold: number;
    distance: number;
    sortFn: SortFn<T>;
    accessFn: GetFn<T>;
    keys: SearchKey<T>[];
    isCaseSensitive: boolean;
    minMatchCharLength: number;
  }

  export interface SearchOptions {
    limit: number;
  }
}
