import type { TextSearch } from '@logic/searcher/textSearch.js';

const countTokens = (string: string): number => {
  let count = 0;

  for (let i = 0, len = string.length; i < len; ++i) if (string[i] !== ' ') ++count;

  return count;
};
const normalize = (value: string): number => Math.round((1 / Math.pow(countTokens(value), 0.5)) * 1000) / 1000;

export interface SearchIndex<T> {
  records: SearchIndex.Record<T>[];
  keys: SearchIndex.Key<T>[];
}

export namespace SearchIndex {
  export const create = <T>(values: T[], options: TextSearch.Options<T>): SearchIndex<T> => {
    const keys = options.keys.map(key => Key.create<T>(key, options));

    const records = values.map<Record<T>>(
      typeof values[0] === 'string'
        ? (item, index) => RecordString.create(item as string, index)
        : (item, index) => RecordObject.create(item, index, keys),
    );

    return { records, keys };
  };

  export type AccessFn<T> = (item: T) => string | string[];

  export interface Key<T> {
    path: string | string[];
    id: string;
    weight: number;
    src: string | string[];
    access: AccessFn<T>;
  }

  export namespace Key {
    const createPath = (key: string | string[]): string[] => (Array.isArray(key) ? key : key.split('.'));

    const createId = (key: string | string[]): string => (Array.isArray(key) ? key.join('.') : key);

    export const create = <T>(key: TextSearch.Key<T>, options: TextSearch.Options<T>): Key<T> => {
      if (typeof key === 'string' || Array.isArray(key)) {
        return {
          path: createPath(key),
          id: createId(key),
          weight: 1,
          src: key,
          access: (item: T) => options.readBy(item, key),
        };
      }

      const path = createPath(key.name);
      return {
        path,
        id: createId(key.name),
        weight: key.weight ?? 1,
        src: key.name,
        access: key.access ?? ((item: T) => options.readBy(item, path)),
      };
    };
  }

  export interface RecordString {
    item: string;
    index: number;
    norm: number;
  }

  export namespace RecordString {
    export const create = (item: string, index: number): RecordString => ({
      item,
      index,
      norm: normalize(item),
    });
  }

  export interface RecordObject<T> {
    item: T;
    index: number;
    children: (RecordString[] | RecordObject.Item)[];
  }

  export namespace RecordObject {
    export interface Item {
      item: string;
      norm: number;
    }

    export namespace Item {
      export const create = (item: string): Item => ({ item, norm: normalize(item) });
    }

    export const create = <T>(item: T, index: number, keys: Key<T>[]): RecordObject<T> => {
      const record: RecordObject<T> = { item, index, children: [] };

      type Item = readonly [string | string[], number];
      const stack: Item[] = [];

      for (let i = 0, len = keys.length; i < len; ++i) {
        const key = keys[i];
        const value = key.access(item);

        if (typeof value === 'string') {
          record.children.push(RecordObject.Item.create(value));
        } else if (Array.isArray(value)) {
          const records = [];

          stack.push([value, -1]);
          do {
            const [value, k] = stack.pop()!;

            if (typeof value === 'string') {
              records.push(RecordString.create(value, k));
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

  export type Record<T> = RecordString | RecordObject<T>;
}
