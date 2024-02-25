import type { FuseResult } from 'fuse.js';
import { Searcher } from './fuse.basic.opt.js';
import { type Accessor, createEffect, createMemo, createSignal, on, type Setter } from 'solid-js';
import { Defer } from '@utils/constants.js';

const extract = <T>({ item }: FuseResult<T>) => item;

export type QueryableReturn<T> = [results: Accessor<T[]>, get: Accessor<string>, set: Setter<string>];

export interface SearchOptions<T> extends Searcher.Options<T>, Searcher.SearchOptions {}

const createQueryableStatic = <T>(items: T[], options?: Partial<SearchOptions<T>>): QueryableReturn<T> => {
  const fuse = new Searcher(items, options);

  const search = (query: string, limit: undefined | number = options?.limit) =>
    query === ''
      ? items
      : limit === undefined
        ? fuse.search(query).map(extract)
        : fuse.search(query, { limit }).map(extract);

  const [get, set] = createSignal('');
  const queried = createMemo(() => search(get()));

  return [queried, get, set];
};

const createQueryableSignal = <T>(items: Accessor<T[]>, options?: Partial<SearchOptions<T>>): QueryableReturn<T> => {
  const initial = items();
  const fuse = new Searcher(initial, options);
  const search = (query: string, limit: undefined | number = options?.limit) =>
    query === '' ? items() : fuse.search(query, limit ? { limit } : undefined).map(extract);

  const [get, set] = createSignal('');
  const [queried, setQueried] = createSignal(initial);

  createEffect(
    on(
      items,
      items => {
        fuse.set(items);
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
