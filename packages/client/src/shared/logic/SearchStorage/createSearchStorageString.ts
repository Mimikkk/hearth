import { createStorageSignal } from '@logic/Storage/createStorageSignal.js';
import { createSearchString } from '@logic/Search/createSearchString.js';
import { Accessor, createMemo, Setter, Signal } from 'solid-js';

export const createSearchStorageString = (searchId: string, storageId: string, fallback: string): Signal<string> => {
  const [storage, setStorage] = createStorageSignal(storageId, fallback);
  const [search, setSearch] = createSearchString(searchId, storage());

  if (storage() !== search()) setStorage(search());

  const get: Accessor<string> = createMemo(() => search() ?? storage());

  const set: Setter<string> = value => {
    const update = value instanceof Function ? value(get()) : value;
    setSearch(update);
    setStorage(update);
  };

  return [get, set] as const;
};
