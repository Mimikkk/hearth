import { createEffect, onCleanup } from 'solid-js';

type Unsubscribe = () => void;

export const createListener = <Type extends keyof WindowEventMap>(
  type: Type,
  fn: (event: WindowEventMap[Type]) => void,
  cleanup: boolean = true,
): Unsubscribe => {
  window.addEventListener(type, fn);
  const clear = () => window.removeEventListener(type, fn);

  if (cleanup) onCleanup(clear);
  return clear;
};

export const createEffectListener = <Type extends keyof WindowEventMap>(
  type: Type,
  fn: (event: WindowEventMap[Type]) => void,
) => createEffect(() => createListener(type, fn));
