import { type Accessor, createEffect, createMemo, createSignal, type Setter } from 'solid-js';
import { TextSearch } from 'a-textsearch';

export type QueryableReturn<T> = [list: Accessor<T[]>, get: Accessor<string>, set: Setter<string>];

export interface SearchOptions<T> extends TextSearch.Options<T> {
  limit: number;
}

const createQueryableStatic = <T>(items: T[], options?: Partial<SearchOptions<T>>): QueryableReturn<T> => {
  const searchFn = TextSearch.create(items, options);

  const search = (query: string) => (query ? searchFn(query, options?.limit).map(({ item }) => item) : items);

  const [get, set] = createSignal('');
  const list = createMemo(() => search(get()));

  return [list, get, set];
};

const createQueryableSignal = <T>(items: Accessor<T[]>, options?: Partial<SearchOptions<T>>): QueryableReturn<T> => {
  const initial = items();
  let searchFn = TextSearch.create(initial, options);
  const search = (query: string) => (query ? searchFn(query, options?.limit).map(({ item }) => item) : items);

  const [get, set] = createSignal('');
  const [list, setList] = createSignal(initial);

  createEffect(() => {
    searchFn = TextSearch.create(items(), options);

    setList(search(get()));
  });

  return [list, get, set];
};

export const createQueryable = <T>(
  items: Accessor<T[]> | T[],
  options?: Partial<SearchOptions<T>>,
): QueryableReturn<T> =>
  typeof items === 'function' ? createQueryableSignal(items, options) : createQueryableStatic(items, options);
