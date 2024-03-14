import { SearchRecord } from '@logic/TextSearch/searchRecord.js';
import { SearchEngine } from '@logic/TextSearch/searchEngine.js';
import { isSome } from '@logic/TextSearch/utils.js';
import { TextSearch } from '@logic/TextSearch/textSearch.js';

export interface SearchResult<T> {
  item: T;
  index: number;
  score: number;
  depth: number;
  matches: SearchResult.Match<T>[];
}

export namespace SearchResult {
  export const find = <T>(engine: SearchEngine, records: SearchRecord<T>[]): SearchResult<T>[] =>
    records.flatMap(record => searchRecord(record, engine)).filter(isSome);

  export type Match<T> = Match.String | Match.Array<T> | Match.Value<T>;

  export namespace Match {
    export interface String {
      item: string;
      norm: number;
      indices: [number, number][];
      score: number;
    }

    export interface Array<T> {
      item: string;
      norm: number;
      indices: [number, number][];
      score: number;
      key: TextSearch.Configuration.Key<T>;
      index: number;
    }

    export interface Value<T> {
      item: string;
      norm: number;
      indices: [number, number][];
      score: number;
      key: TextSearch.Configuration.Key<T>;
    }

    export type Object<T> = Value<T> | Array<T>;
  }
}

const matchValue = <T>(
  { item, norm }: SearchRecord.String,
  key: TextSearch.Configuration.Key<T>,
  engine: SearchEngine,
): SearchResult.Match.Value<T> | null => {
  const { isMatch, score, indices } = engine(item);

  if (!isMatch) return null;
  return { score, key, item, norm, indices };
};

const matchArray = <T>(
  { item, norm, index }: SearchRecord.ArrayString,
  key: TextSearch.Configuration.Key<T>,
  engine: SearchEngine,
): SearchResult.Match.Array<T> | null => {
  const { isMatch, score, indices } = engine(item);

  if (!isMatch) return null;
  return { score, key, index, item, norm, indices };
};

const matchObject = <T>({ entries }: SearchRecord.Object<T>, engine: SearchEngine): SearchResult.Match.Object<T>[] => {
  const matches: SearchResult.Match.Object<T>[] = [];

  for (const [key, records] of entries) {
    if (Array.isArray(records)) {
      for (const record of records) {
        const match = matchArray(record, key, engine);
        if (match) matches.push(match);
      }
    } else {
      const match = matchValue(records, key, engine);

      if (match) matches.push(match);
    }
  }

  return matches;
};

const searchString = <T>(
  { item, index, norm }: SearchRecord.ArrayString,
  engine: SearchEngine,
): SearchResult<T> | null => {
  const { isMatch, score, indices } = engine(item);

  if (!isMatch) return null;
  const matches = [{ score, item, norm, indices }];
  return { item: item as T, index, matches, depth: 0, score: Math.pow(score, norm) };
};

const searchObject = <T>(record: SearchRecord.Object<T>, engine: SearchEngine): SearchResult<T>[] => {
  const flatten = (record: SearchRecord.Object<T>): SearchRecord.Object<T>[] => [
    record,
    ...(record.children?.flatMap(child => flatten(child)) ?? []),
  ];

  const results = [];

  const nested = flatten(record);
  for (const record of nested) {
    const matches = matchObject(record, engine);
    if (!matches.length) continue;

    const { item, index, depth } = record;
    const score = matches.reduce((acc, { key, norm, score }) => acc * Math.pow(score, key.weight * norm), 1);

    results.push({ item, index, matches, score, depth });
  }

  return results;
};

const searchRecord = <T>(record: SearchRecord<T>, engine: SearchEngine): SearchResult<T> | SearchResult<T>[] | null =>
  'norm' in record ? searchString<T>(record, engine) : searchObject(record, engine);
