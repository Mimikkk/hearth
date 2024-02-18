import { createStorageSignal } from '@logic/Storage/createStorageSignal.js';
import { createMemo, createRenderEffect } from 'solid-js';

const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
export const createTheme = (key: string) => {
  const [get, set] = createStorageSignal<undefined | 'dark' | 'light'>(key, undefined);

  createRenderEffect(() => {
    const list = document.documentElement.classList;
    const theme = get() ?? system;

    list.remove(theme === 'dark' ? 'light' : 'dark');
    list.add(theme);
  });

  return {
    mode: createMemo(() => get() ?? system),
    set,
    toggle() {
      const theme = get();

      if (system == 'dark') {
        if (theme === undefined) {
          set('light');
        } else if (theme === 'light') {
          set('dark');
        } else if (theme === 'dark') {
          set(undefined);
        }
      } else {
        if (theme === undefined) {
          set('dark');
        } else if (theme === 'dark') {
          set('light');
        } else if (theme === 'light') {
          set(undefined);
        }
      }
    },
  };
};
