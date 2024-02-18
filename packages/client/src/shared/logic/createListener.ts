import { createEffect, onCleanup } from 'solid-js';

export const createListener = <Type extends keyof WindowEventMap>(
  type: Type,
  fn: (event: WindowEventMap[Type]) => void,
) => {
  window.addEventListener(type, fn);
  onCleanup(() => window.removeEventListener(type, fn));
};

export const createEffectListener = <Type extends keyof WindowEventMap>(
  type: Type,
  fn: (event: WindowEventMap[Type]) => void,
) => createEffect(() => createListener(type, fn));
