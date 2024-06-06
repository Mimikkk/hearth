import { createSignal } from 'solid-js';
import { debounce } from 'lodash-es';
import { identity } from '@utils/identity.js';

export namespace Search {
  export const read = () => new URL(window.location.href).searchParams;

  export const [params, setParams] = createSignal(read());
  export const set = debounce(setParams, 50);

  window.addEventListener('popstate', () => set(read()));

  const deleteEmpty = (params: URLSearchParams) => {
    for (const key of params.keys()) {
      let value = params.get(key)?.trim();

      if (value === null || value === '') params.delete(key);
    }

    return params;
  };
  export const update = (fn: (params: URLSearchParams) => void) =>
    set(params => {
      fn(params);

      window.history.pushState(null, '', `?${deleteEmpty(params)}`);

      return new URLSearchParams(params);
    });

  export const clear = (key: string) => update(params => params.delete(key));
  export const clears = (key: string[]) => update(params => key.forEach(key => params.delete(key)));
  export const get = <T>(key: string, decode: (value: string) => T = identity<T> as any): T | null => {
    const value = params().get(key);

    return value === null ? value : decode(value);
  };
}
