import { TextSearch } from './textSearch.js';
import { Path } from 'a-path';
import { normalize } from './utils.js';

export interface SearchIndex<T> {
  records: SearchIndex.Record<T>[];
  keys: SearchIndex.Key<T>[];
}

export namespace SearchIndex {
  export const create = <T>(values: T[], options: TextSearch.Options<T>): SearchIndex<T> => {
    const keys = options.keys.map(Key.create);

    const records = values.map<Record<T>>(
      typeof values[0] === 'string'
        ? (item, index) => RecordString.create(item as string, index)
        : (item, index) => RecordObject.create(item, index, keys),
    );

    return { records, keys };
  };

  export interface Key<T> {
    path: Path<T>;
    weight: number;
  }

  export namespace Key {
    export const create = <T>(key: TextSearch.Key<T>): Key<T> =>
      TextSearch.ValueKey.is(key) ? { path: key, weight: 1 } : { path: key.path, weight: key.weight ?? 1 };
  }

  export interface RecordString {
    item: string;
    index: number;
    norm: number;
  }

  export namespace RecordString {
    export const create = (item: string, index: number): RecordString => ({ item, index, norm: normalize(item) });
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
        const value = Path.get(item as any, key.path) as string | string[];

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
