import { createMemo } from 'solid-js';
import { Search } from '@logic/Search/Search.js';

export const createSearchSignal = <T>(
  param: string,
  fallback: T,
  encode: (value: T) => string,
  decode: (value: string) => T,
) => {
  const initial = Search.params().get(param);
  if (initial === null) Search.update(params => params.set(param, encode(fallback)));

  const value = createMemo(() => decode(Search.params().get(param)!));
  const update = (value: T) => Search.update(params => params.set(param, encode(value)));
  const remove = () => Search.update(params => params.delete(param));

  return [value, update, remove] as const;
};
