import { createStorageSignal } from '@logic/Storage/createStorageSignal.js';
import { createSearchString } from '@logic/Search/createSearchString.js';
import { createMemo } from 'solid-js';

export const createSearchStorageString = (
  searchId: string,
  storageId: string,
  fallback: string,
): [get: () => string, set: (value: string) => void] => {
  const [storage, setStorage] = createStorageSignal(storageId, fallback);
  const [search, setSearch] = createSearchString(searchId, storage());

  if (storage() !== search()) setStorage(search());

  const get = createMemo(() => search() ?? storage());

  const set = (value: string) => {
    setSearch(value);
    setStorage(value);
  };

  return [get, set] as const;
};
