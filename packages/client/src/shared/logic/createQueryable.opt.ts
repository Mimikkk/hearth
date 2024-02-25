import { TextSearch } from './searcher/textSearch.js';
import { type Accessor, createEffect, createMemo, createSignal, on, type Setter } from 'solid-js';
import { Defer } from '@utils/constants.js';

export type QueryableReturn<T> = [results: Accessor<T[]>, get: Accessor<string>, set: Setter<string>];

export interface SearchOptions<T> extends TextSearch.Options<T>, TextSearch.SearchOptions {}

const createQueryableStatic = <T>(items: T[], options?: Partial<SearchOptions<T>>): QueryableReturn<T> => {
  const s = TextSearch.create(items, options);

  const search = (query: string, limit: undefined | number = options?.limit) =>
    query === ''
      ? items
      : limit === undefined
        ? s(query).map(({ item }) => item)
        : s(query, { limit }).map(({ item }) => item);

  const [get, set] = createSignal('');
  const queried = createMemo(() => search(get()));

  return [queried, get, set];
};

const createQueryableSignal = <T>(items: Accessor<T[]>, options?: Partial<SearchOptions<T>>): QueryableReturn<T> => {
  const initial = items();
  const s = TextSearch.create(initial, options);
  const search = (query: string, limit: undefined | number = options?.limit) =>
    query === '' ? items() : s(query, limit ? { limit } : undefined).map(({ item }) => item);

  const [get, set] = createSignal('');
  const [queried, setQueried] = createSignal(initial);

  createEffect(
    on(
      items,
      items => {
        s.set(items);
        setQueried(search(get()));
      },
      Defer,
    ),
  );

  createEffect(() => setQueried(search(get())));

  return [queried, get, set];
};

export const createQueryable = <T>(
  items: Accessor<T[]> | T[],
  options?: Partial<SearchOptions<T>>,
): QueryableReturn<T> =>
  typeof items === 'function' ? createQueryableSignal(items, options) : createQueryableStatic(items, options);
