type FuseGetFn<T> = (obj: T, path: string | string[]) => string[] | string;

interface FuseOptionKeyObject<T> {
  name: string | string[];
  weight?: number;
  getFn?: (obj: T) => string[] | string;
}

type FuseOptionKey<T> = FuseOptionKeyObject<T> | string | string[];

interface FuseSortFunctionItem {
  [key: string]: { $: string } | { $: string; idx: number }[];
}

interface FuseSortFnMatch {
  score: number;
  key: string;
  value: string;
  indices: number[];
}

interface FuseSortFnMatchList extends FuseSortFnMatch {
  idx: number;
}

interface FuseSortFunctionArg {
  idx: number;
  item: FuseSortFunctionItem;
  score: number;
  matches?: (FuseSortFnMatch | FuseSortFnMatchList)[];
}

type FuseSortFn = (a: FuseSortFunctionArg, b: FuseSortFunctionArg) => number;

const Config: Fuse.Options = {
  includeMatches: false,
  findAllMatches: false,
  minMatchCharLength: 1,
  isCaseSensitive: false,
  includeScore: false,
  keys: [],
  shouldSort: true,
  sortFn: (a, b) => (a.score === b.score ? (a.idx < b.idx ? -1 : 1) : a.score < b.score ? -1 : 1),
  location: 0,
  threshold: 0.6,
  distance: 100,
  getFn: get,
  ignoreLocation: false,
  ignoreFieldNorm: false,
  fieldNormWeight: 1,
};

const baseToString = (value: any): string => {
  if (typeof value == 'string') return value;

  let result = value + '';
  return result == '0' && 1 / value == -Infinity ? '-0' : result;
};

const getTag = (value: any) => {
  return value == null
    ? value === undefined
      ? '[object Undefined]'
      : '[object Null]'
    : Object.prototype.toString.call(value);
};

const toString = (value: any) => (value == null ? '' : baseToString(value));

const isString = (value: any) => typeof value === 'string';

const isNumber = (value: any) => typeof value === 'number';

const isObjectLike = (value: any) => isObject(value) && value !== null;

const isBoolean = (value: any) =>
  value === true || value === false || (isObjectLike(value) && getTag(value) == '[object Boolean]');

const isObject = (value: any) => typeof value === 'object';

const isDefined = (value: any) => value !== undefined && value !== null;

const isBlank = (value: any) => !value.trim().length;

const MISSING_KEY_PROPERTY = (name: string) => `Missing ${name} property in key`;

const INVALID_KEY_WEIGHT_VALUE = (key: string) => `Property 'weight' in key '${key}' must be a positive integer`;

const hasOwn = Object.prototype.hasOwnProperty;

class KeyStore {
  _keys: any[];
  _keyMap: any;

  constructor(keys: any[]) {
    this._keys = [];
    this._keyMap = {};

    let count = keys.length;
    let totalWeight = 0;
    for (let i = 0; i < count; ++i) {
      let obj = createKey(keys[i]);

      this._keys.push(obj);
      this._keyMap[obj.id] = obj;

      totalWeight += obj.weight;
    }

    for (let i = 0; i < count; ++i) this._keys[i].weight /= totalWeight;
  }

  get(keyId: number) {
    return this._keyMap[keyId];
  }

  keys() {
    return this._keys;
  }

  toJSON() {
    return JSON.stringify(this._keys);
  }
}

function createKey(key) {
  let path = null;
  let id = null;
  let src = null;
  let weight = 1;
  let getFn = null;

  if (isString(key) || Array.isArray(key)) {
    src = key;
    path = createKeyPath(key);
    id = createKeyId(key);
  } else {
    if (!hasOwn.call(key, 'name')) {
      throw new Error(MISSING_KEY_PROPERTY('name'));
    }

    const name = key.name;
    src = name;

    if (hasOwn.call(key, 'weight')) {
      weight = key.weight;

      if (weight <= 0) {
        throw new Error(INVALID_KEY_WEIGHT_VALUE(name));
      }
    }

    path = createKeyPath(name);
    id = createKeyId(name);
    getFn = key.getFn;
  }

  return { path, id, weight, src, getFn };
}

function createKeyPath(key) {
  return Array.isArray(key) ? key : key.split('.');
}

function createKeyId(key) {
  return Array.isArray(key) ? key.join('.') : key;
}

function get(obj, path) {
  let list = [];
  let arr = false;

  const deepGet = (obj, path, index) => {
    if (!isDefined(obj)) {
      return;
    }
    if (!path[index]) {
      // If there's no path left, we've arrived at the object we care about.
      list.push(obj);
    } else {
      let key = path[index];

      const value = obj[key];

      if (!isDefined(value)) {
        return;
      }

      // If we're at the last value in the path, and if it's a string/number/bool,
      // add it to the list
      if (index === path.length - 1 && (isString(value) || isNumber(value) || isBoolean(value))) {
        list.push(toString(value));
      } else if (Array.isArray(value)) {
        arr = true;
        // Search each item in the array.
        for (let i = 0, len = value.length; i < len; i += 1) {
          deepGet(value[i], path, index + 1);
        }
      } else if (path.length) {
        // An object. Recurse further.
        deepGet(value, path, index + 1);
      }
    }
  };

  // Backwards compatibility (since path used to be a string)
  deepGet(obj, isString(path) ? path.split('.') : path, 0);

  return arr ? list : list[0];
}

const SPACE = /[^ ]+/g;

function norm(weight = 1, mantissa = 3) {
  const cache = new Map();
  const m = Math.pow(10, mantissa);

  return {
    get(value) {
      const numTokens = value.match(SPACE).length;

      if (cache.has(numTokens)) {
        return cache.get(numTokens);
      }

      // Default function is 1/sqrt(x), weight makes that variable
      const norm = 1 / Math.pow(numTokens, 0.5 * weight);

      // In place of `toFixed(mantissa)`, for faster computation
      const n = parseFloat(Math.round(norm * m) / m);

      cache.set(numTokens, n);

      return n;
    },
    clear() {
      cache.clear();
    },
  };
}

class FuseIndex<T> {
  constructor({ getFn = Config.getFn, fieldNormWeight = Config.fieldNormWeight } = {}) {
    this.norm = norm(fieldNormWeight, 3);
    this.getFn = getFn;
    this.isCreated = false;

    this.setIndexRecords();
  }

  docs: T[];

  setSources(docs: T[]) {
    this.docs = docs;
  }

  setIndexRecords(records = []) {
    this.records = records;
  }

  setKeys(keys = []) {
    this.keys = keys;
    this._keysMap = {};
    keys.forEach((key, idx) => {
      this._keysMap[key.id] = idx;
    });
  }

  create() {
    if (this.isCreated || !this.docs.length) {
      return;
    }

    this.isCreated = true;

    // List is Array<String>
    if (isString(this.docs[0])) {
      this.docs.forEach((doc, docIndex) => {
        this._addString(doc, docIndex);
      });
    } else {
      // List is Array<Object>
      this.docs.forEach((doc, docIndex) => {
        this._addObject(doc, docIndex);
      });
    }

    this.norm.clear();
  }

  // Adds a doc to the end of the index
  add(doc) {
    const idx = this.size();

    if (isString(doc)) {
      this._addString(doc, idx);
    } else {
      this._addObject(doc, idx);
    }
  }

  // Removes the doc at the specified index of the index
  removeAt(idx) {
    this.records.splice(idx, 1);

    // Change ref index of every subsquent doc
    for (let i = idx, len = this.size(); i < len; i += 1) {
      this.records[i].i -= 1;
    }
  }

  getValueForItemAtKeyId(item, keyId) {
    return item[this._keysMap[keyId]];
  }

  size() {
    return this.records.length;
  }

  _addString(doc, docIndex) {
    if (!isDefined(doc) || isBlank(doc)) {
      return;
    }

    let record = {
      v: doc,
      i: docIndex,
      n: this.norm.get(doc),
    };

    this.records.push(record);
  }

  _addObject(doc, docIndex) {
    let record = { i: docIndex, $: {} };

    // Iterate over every key (i.e, path), and fetch the value at that key
    this.keys.forEach((key, keyIndex) => {
      let value = key.getFn ? key.getFn(doc) : this.getFn(doc, key.path);

      if (!isDefined(value)) {
        return;
      }

      if (Array.isArray(value)) {
        let subRecords = [];
        const stack = [{ nestedArrIndex: -1, value }];

        while (stack.length) {
          const { nestedArrIndex, value } = stack.pop();

          if (!isDefined(value)) {
            continue;
          }

          if (isString(value) && !isBlank(value)) {
            let subRecord = {
              v: value,
              i: nestedArrIndex,
              n: this.norm.get(value),
            };

            subRecords.push(subRecord);
          } else if (Array.isArray(value)) {
            value.forEach((item, k) => {
              stack.push({
                nestedArrIndex: k,
                value: item,
              });
            });
          } else;
        }
        record.$[keyIndex] = subRecords;
      } else if (isString(value) && !isBlank(value)) {
        let subRecord = {
          v: value,
          n: this.norm.get(value),
        };

        record.$[keyIndex] = subRecord;
      }
    });

    this.records.push(record);
  }

  toJSON() {
    return {
      keys: this.keys,
      records: this.records,
    };
  }
}

function createIndex(
  keys: string[],
  docs: any,
  { getFn = Config.getFn, fieldNormWeight = Config.fieldNormWeight } = {},
) {
  const myIndex = new FuseIndex({ getFn, fieldNormWeight });
  myIndex.setKeys(keys.map(createKey));
  myIndex.setSources(docs);
  myIndex.create();
  return myIndex;
}

function computeScore$1(
  pattern: string,
  {
    errors = 0,
    currentLocation = 0,
    expectedLocation = 0,
    distance = Config.distance,
    ignoreLocation = Config.ignoreLocation,
  } = {},
) {
  const accuracy = errors / pattern.length;

  if (ignoreLocation) return accuracy;

  const proximity = Math.abs(expectedLocation - currentLocation);

  if (!distance) return proximity ? 1.0 : accuracy;

  return accuracy + proximity / distance;
}

function convertMaskToIndices(matchmask: any[] = [], minMatchCharLength: number): [number, number][] {
  let indices: [number, number][] = [];
  let start = -1;
  let end = -1;
  let i = 0;

  for (let len = matchmask.length; i < len; i += 1) {
    let match = matchmask[i];
    if (match && start === -1) {
      start = i;
    } else if (!match && start !== -1) {
      end = i - 1;
      if (end - start + 1 >= minMatchCharLength) {
        indices.push([start, end]);
      }
      start = -1;
    }
  }

  if (matchmask[i - 1] && i - start >= minMatchCharLength) {
    indices.push([start, i - 1]);
  }

  return indices;
}

const MaxSize = 32;

function search(
  text: string,
  pattern: string,
  patternMask: PatternMask,
  {
    location,
    distance,
    threshold,
    findAllMatches,
    minMatchCharLength,
    includeMatches,
    ignoreLocation,
  }: BitapSearch.Options,
): BitapSearch.Result {
  const patternLen = pattern.length;
  // Set starting location at beginning text and initialize the alphabet.
  const textLen = text.length;
  // Handle the case when location > text.length
  const expectedLocation = Math.max(0, Math.min(location, textLen));
  // Highest score beyond which we give up.
  let currentThreshold = threshold;
  // Is there a nearby exact match? (speedup)
  let bestLocation = expectedLocation;

  // Performance: only computer matches when the minMatchCharLength > 1
  // OR if `includeMatches` is true.
  const computeMatches = minMatchCharLength > 1 || includeMatches;
  // A mask of the matches, used for building the indices
  const matchMask = computeMatches ? Array(textLen) : [];

  let index;

  // Get all exact matches, here for speed up
  while ((index = text.indexOf(pattern, bestLocation)) > -1) {
    let score = computeScore$1(pattern, {
      currentLocation: index,
      expectedLocation,
      distance,
      ignoreLocation,
    });

    currentThreshold = Math.min(score, currentThreshold);
    bestLocation = index + patternLen;

    if (computeMatches) {
      let i = 0;
      while (i < patternLen) {
        matchMask[index + i] = 1;
        i += 1;
      }
    }
  }

  // Reset the best location
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
        ignoreLocation,
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
    let finish = findAllMatches ? textLen : Math.min(expectedLocation + binMid, textLen) + patternLen;

    let bitArr = Array(finish + 2);

    bitArr[finish + 1] = (1 << i) - 1;

    for (let j = finish; j >= start; j -= 1) {
      let currentLocation = j - 1;
      let charMatch = patternMask[text.charAt(currentLocation)];

      if (computeMatches) {
        // Speed up: quick bool to int conversion (i.e, `charMatch ? 1 : 0`)
        matchMask[currentLocation] = +!!charMatch;
      }

      bitArr[j] = ((bitArr[j + 1] << 1) | 1) & charMatch;
      if (i) bitArr[j] |= ((lastBitArr[j + 1] | lastBitArr[j]) << 1) | 1 | lastBitArr[j + 1];

      if (bitArr[j] & mask) {
        finalScore = computeScore$1(pattern, {
          errors: i,
          currentLocation,
          expectedLocation,
          distance,
          ignoreLocation,
        });

        // This match will almost certainly be better than any existing match.
        // But check anyway.
        if (finalScore <= currentThreshold) {
          // Indeed it is
          currentThreshold = finalScore;
          bestLocation = currentLocation;

          // Already passed `loc`, downhill from here on in.
          if (bestLocation <= expectedLocation) {
            break;
          }

          // When passing `bestLocation`, don't exceed our current distance from `expectedLocation`.
          start = Math.max(1, 2 * expectedLocation - bestLocation);
        }
      }
    }

    // No hope for a (better) match at greater error levels.
    const score = computeScore$1(pattern, {
      errors: i + 1,
      currentLocation: expectedLocation,
      expectedLocation,
      distance,
      ignoreLocation,
    });

    if (score > currentThreshold) {
      break;
    }

    lastBitArr = bitArr;
  }

  const result: BitapSearch.Result = {
    isMatch: bestLocation >= 0,
    score: Math.max(0.001, finalScore),
  };

  if (computeMatches) {
    const indices = convertMaskToIndices(matchMask, minMatchCharLength);

    if (!indices.length) result.isMatch = false;
    else if (includeMatches) result.indices = indices;
  }

  return result;
}

type PatternMask = Record<string, number>;

const createPatternMask = (pattern: string): PatternMask => {
  const mask: Record<string, number> = {};

  for (let i = 0, len = pattern.length; i < len; ++i) {
    const char = pattern[i];

    mask[char] = (mask[char] || 0) | (1 << (len - i - 1));
  }

  return mask;
};
const createChunks = (pattern: string): BitapSearch.Chunk[] => {
  const createChunk = (pattern: string, startIndex: number): BitapSearch.Chunk => ({
    pattern,
    alphabet: createPatternMask(pattern),
    startIndex,
  });
  const chunks = [];

  const len = pattern.length;
  if (len > MaxSize) {
    let i = 0;
    const remainder = len % MaxSize;
    const end = len - remainder;

    while (i < end) {
      chunks.push(createChunk(pattern.substring(i, MaxSize), i));
      i += MaxSize;
    }

    if (remainder) {
      const startIndex = len - MaxSize;
      chunks.push(createChunk(pattern.substring(startIndex), startIndex));
    }
  } else if (len > 0) {
    chunks.push(createChunk(pattern, 0));
  }

  return chunks;
};

class BitapSearch {
  options: BitapSearch.Options;
  pattern: string;
  chunks: BitapSearch.Chunk[];

  constructor(pattern: string, options: BitapSearch.Options) {
    this.options = options;
    this.pattern = this.options.isCaseSensitive ? pattern : pattern.toLowerCase();
    this.chunks = createChunks(this.pattern);
  }

  searchIn(text: string): BitapSearch.Result {
    if (!this.options.isCaseSensitive) text = text.toLowerCase();
    if (this.pattern === text) {
      return {
        isMatch: true,
        score: 0,
        indices: this.options.includeMatches ? [[0, text.length - 1]] : undefined,
      };
    }

    let indices: undefined | [number, number][] = this.options.includeMatches ? [] : undefined;
    let score = 0;
    let isMatch = false;

    const { location } = this.options;
    for (let i = 0; i < this.chunks.length; ++i) {
      const { pattern, alphabet, startIndex } = this.chunks[i];
      this.options.location = location + startIndex;
      const match = search(text, pattern, alphabet, this.options);

      if (match.isMatch) isMatch = true;

      score += match.score;

      if (match.isMatch && match.indices) indices?.push(...match.indices);
    }
    this.options.location = location;

    return {
      isMatch,
      score: isMatch ? score / this.chunks.length : 1,
      indices: isMatch ? indices : undefined,
    };
  }
}

namespace BitapSearch {
  export interface Options {
    location: number;
    threshold: number;
    distance: number;
    includeMatches: boolean;
    findAllMatches: boolean;
    minMatchCharLength: number;
    isCaseSensitive: boolean;
    ignoreLocation: boolean;
  }

  export interface Chunk {
    pattern: string;
    alphabet: Record<string, number>;
    startIndex: number;
  }

  export interface Result {
    isMatch: boolean;
    score: number;
    indices?: [number, number][];
  }
}

const createSearcher = (pattern: string, options: BitapSearch.Options) => new BitapSearch(pattern, options);

function computeScore(results, options: Fuse.Options) {
  results.forEach(result => {
    let totalScore = 1;

    result.matches.forEach(({ key, norm, score }) => {
      const weight = key ? key.weight : null;

      totalScore *= Math.pow(
        score === 0 && weight ? Number.EPSILON : score,
        (weight || 1) * (options.ignoreFieldNorm ? 1 : norm),
      );
    });

    result.score = totalScore;
  });
}

function transformMatches(result, data) {
  const matches = result.matches;
  data.matches = [];

  if (!isDefined(matches)) {
    return;
  }

  matches.forEach(match => {
    if (!isDefined(match.indices) || !match.indices.length) {
      return;
    }

    const { indices, value } = match;

    let obj = {
      indices,
      value,
    };

    if (match.key) {
      obj.key = match.key.src;
    }

    if (match.idx > -1) {
      obj.refIndex = match.idx;
    }

    data.matches.push(obj);
  });
}

function transformScore(result, data) {
  data.score = result.score;
}

function format(results, docs, { includeMatches = Config.includeMatches, includeScore = Config.includeScore } = {}) {
  const transformers = [];

  if (includeMatches) transformers.push(transformMatches);
  if (includeScore) transformers.push(transformScore);

  return results.map(result => {
    const { idx } = result;

    const data = {
      item: docs[idx],
      refIndex: idx,
    };

    if (transformers.length) {
      transformers.forEach(transformer => {
        transformer(result, data);
      });
    }

    return data;
  });
}

class Fuse<T> {
  options: Fuse.Options<T>;
  store: KeyStore;
  index: FuseIndex<T>;
  items: T[];

  constructor(items: T[], options?: Partial<Fuse.Options<T>>, index?: FuseIndex<T>) {
    this.options = {
      getFn: options?.getFn ?? Config.getFn,
      keys: options?.keys ?? Config.keys,
      includeMatches: options?.includeMatches ?? Config.includeMatches,
      includeScore: options?.includeScore ?? Config.includeScore,
      ignoreLocation: options?.ignoreLocation ?? Config.ignoreLocation,
      minMatchCharLength: options?.minMatchCharLength ?? Config.minMatchCharLength,
      shouldSort: options?.shouldSort ?? Config.shouldSort,
      sortFn: options?.sortFn ?? Config.sortFn,
      location: options?.location ?? Config.location,
      threshold: options?.threshold ?? Config.threshold,
      distance: options?.distance ?? Config.distance,
      findAllMatches: options?.findAllMatches ?? Config.findAllMatches,
      isCaseSensitive: options?.isCaseSensitive ?? Config.isCaseSensitive,
      ignoreFieldNorm: options?.ignoreFieldNorm ?? Config.ignoreFieldNorm,
      fieldNormWeight: options?.fieldNormWeight ?? Config.fieldNormWeight,
    };

    this.store = new KeyStore(this.options.keys);

    this.setCollection(items, index);
  }

  setCollection(docs: T[], index?: FuseIndex<T>): void {
    this.items = docs;

    this.index =
      index ??
      createIndex(this.options.keys, this.items, {
        getFn: this.options.getFn,
        fieldNormWeight: this.options.fieldNormWeight,
      });
  }

  add(doc: T): void {
    this.items.push(doc);
    this.index.add(doc);
  }

  search(query: string, options?: Partial<Fuse.SearchOptions>) {
    let results = typeof this.items[0] === 'string' ? this._searchStringList(query) : this._searchObjectList(query);

    computeScore(results, this.options);

    if (this.options.shouldSort) results.sort(this.options.sortFn);
    if (options?.limit) results = results.slice(0, options.limit);

    return format(results, this.items, this.options);
  }

  _searchStringList(query: string): FuseSortFunctionArg[] {
    const searcher = createSearcher(query, this.options);
    const { records } = this.index;
    const results = [];

    // Iterate over every string in the index
    records.forEach(({ v: text, i: idx, n: norm }) => {
      if (!isDefined(text)) return;

      const { isMatch, score, indices } = searcher.searchIn(text);

      if (isMatch) {
        results.push({
          item: text,
          idx,
          matches: [{ score, value: text, norm, indices }],
        });
      }
    });

    return results;
  }

  _searchObjectList(query: string): FuseSortFunctionArg[] {
    const searcher = createSearcher(query, this.options);
    const { keys, records } = this.index;
    const results = [];

    for (let i = 0, len = records.length; i < len; ++i) {
      const { $: item, i: idx } = records[i];

      if (!isDefined(item)) continue;

      let matches = [];

      for (let j = 0, len = keys.length; j < len; ++j) {
        matches.push(...this._findMatches({ key: keys[j], value: item[j], searcher }));
      }

      if (matches.length) results.push({ idx, item, matches });
    }

    return results;
  }

  _findMatches({ key, value, searcher }: any) {
    if (!isDefined(value)) {
      return [];
    }

    let matches = [];

    if (Array.isArray(value)) {
      value.forEach(({ v: text, i: idx, n: norm }) => {
        if (!isDefined(text)) {
          return;
        }

        const { isMatch, score, indices } = searcher.searchIn(text);

        if (isMatch) {
          matches.push({
            score,
            key,
            value: text,
            idx,
            norm,
            indices,
          });
        }
      });
    } else {
      const { v: text, n: norm } = value;

      const { isMatch, score, indices } = searcher.searchIn(text);

      if (isMatch) {
        matches.push({ score, key, value: text, norm, indices });
      }
    }

    return matches;
  }
}

namespace Fuse {
  export interface Options<T = unknown> {
    /** Indicates whether comparisons should be case-sensitive. */
    isCaseSensitive: boolean;
    /** Determines how close the match must be to the fuzzy location (specified by `location`). An exact letter match which is `distance` characters away from the fuzzy location would score as a complete mismatch. A `distance` of `0` requires the match be at the exact `location` specified. A distance of `1000` would require a perfect match to be within `800` characters of the `location` to be found using a `threshold` of `0.8`. */
    distance: number;
    /** When true, the matching function will continue to the end of a search pattern even if a perfect match has already been located in the string. */
    findAllMatches: boolean;
    /** The function to use to retrieve an object's value at the provided path. The default will also search nested paths. */
    getFn: FuseGetFn<T>;
    /** When `true`, search will ignore `location` and `distance`, so it won't matter where in the string the pattern appears. */
    ignoreLocation: boolean;
    /** When `true`, the calculation for the relevance score (used for sorting) will ignore the `field-length norm`. */
    ignoreFieldNorm: boolean;
    /** Determines how much the `field-length norm` affects scoring. A value of `0` is equivalent to ignoring the field-length norm. A value of `0.5` will greatly reduce the effect of field-length norm, while a value of `2.0` will greatly increase it. */
    fieldNormWeight: number;
    /** Whether the matches should be included in the result set. When `true`, each record in the result set will include the indices of the matched characters. These can consequently be used for highlighting purposes. */
    includeMatches: boolean;
    /** Whether the score should be included in the result set. A score of `0`indicates a perfect match, while a score of `1` indicates a complete mismatch. */
    includeScore: boolean;
    /** List of keys that will be searched. This supports nested paths, weighted search, searching in arrays of `strings` and `objects`. */
    keys: FuseOptionKey<T>[];
    /** Determines approximately where in the text is the pattern expected to be found. */
    location: number;
    /** Only the matches whose length exceeds this value will be returned. (For instance, if you want to ignore single character matches in the result, set it to `2`). */
    minMatchCharLength: number;
    /** Whether to sort the result list, by score. */
    shouldSort: boolean;
    /** The function to use to sort all the results. The default will sort by ascending relevance score, ascending index. */
    sortFn: FuseSortFn;
    /** At what point does the match algorithm give up. A threshold of `0.0` requires a perfect match (of both letters and location), a threshold of `1.0` would match anything. */
    threshold: number;
  }

  export interface SearchOptions {
    limit: number;
  }
}

export default Fuse;
