import type { TextSearch } from '@logic/searcher/textSearch.js';

export type AccessFn<T> = (item: T) => string | string[];

const countTokens = (string: string): number => {
  let count = 0;

  for (let i = 0, len = string.length; i < len; ++i) if (string[i] !== ' ') ++count;

  return count;
};
const normalize = (value: string): number => Math.round((1 / Math.pow(countTokens(value), 0.5)) * 1000) / 1000;

export interface IndexKey<T> {
  path: string | string[];
  id: string;
  weight: number;
  src: string | string[];
  access: AccessFn<T>;
}

export namespace IndexKey {
  const createPath = (key: string | string[]): string[] => (Array.isArray(key) ? key : key.split('.'));

  const createId = (key: string | string[]): string => (Array.isArray(key) ? key.join('.') : key);

  export const create = <T>(key: TextSearch.Key<T>, options: TextSearch.Options<T>): IndexKey<T> => {
    if (typeof key === 'string' || Array.isArray(key)) {
      return {
        path: createPath(key),
        id: createId(key),
        weight: 1,
        src: key,
        access: (item: T) => options.readFn(item, key),
      };
    }

    const path = createPath(key.name);
    return {
      path,
      id: createId(key.name),
      weight: key.weight ?? 1,
      src: key.name,
      access: key.access ?? ((item: T) => options.readFn(item, path)),
    };
  };
}

export interface IndexRecordString {
  value: string;
  index: number;
  norm: number;
}

export namespace IndexRecordString {
  export const create = (value: string, index: number): IndexRecordString => ({
    value,
    index,
    norm: normalize(value),
  });
}

export interface IndexRecordObject {
  index: number;
  children: (IndexRecordString[] | IndexRecordObject.Item)[];
}

export namespace IndexRecordObject {
  export interface Item {
    value: string;
    norm: number;
  }

  export namespace Item {
    export const create = (value: string): Item => ({ value, norm: normalize(value) });
  }

  export const create = <T>(item: T, index: number, keys: IndexKey<T>[]): IndexRecordObject => {
    const record: IndexRecordObject = { index, children: [] };

    type Item = readonly [string | string[], number];
    const stack: Item[] = [];

    for (let i = 0, len = keys.length; i < len; ++i) {
      const key = keys[i];
      const value = key.access(item);

      if (typeof value === 'string') {
        record.children.push(IndexRecordObject.Item.create(value));
      } else if (Array.isArray(value)) {
        const records = [];

        stack.push([value, -1]);
        do {
          const [value, k] = stack.pop()!;

          if (typeof value === 'string') {
            records.push(IndexRecordString.create(value, k));
          } else if (Array.isArray(value)) {
            stack.push(...value.map((value, k) => [value, k] as const));
          }
        } while (stack.length);

        record.children.push(records);
      }
    }

    return record;
  };
}

export type IndexRecord = IndexRecordString | IndexRecordObject;

export interface SearchIndex<T> {
  records: IndexRecord[];
  keys: IndexKey<T>[];
}

export namespace SearchIndex {
  export const create = <T>(values: T[], options: TextSearch.Options<T>): SearchIndex<T> => {
    const keys = options.keys.map(key => IndexKey.create(key, options));

    const records = values.map<IndexRecord>(
      typeof values[0] === 'string'
        ? (item, index) => IndexRecordString.create(item as string, index)
        : (item, index) => IndexRecordObject.create(item, index, keys),
    );

    return { records, keys };
  };
}
