import { createEffect, onCleanup } from "solid-js";

export type UnsubscribeListener = () => void;

export const createListener = <Type extends keyof WindowEventMap>(
  type: Type,
  fn: (event: WindowEventMap[Type]) => void,
  cleanup: boolean = true,
): UnsubscribeListener => {
  globalThis.addEventListener(type, fn);
  const clear = () => globalThis.removeEventListener(type, fn);

  if (cleanup) onCleanup(clear);
  return clear;
};

export const createEffectListener = <Type extends keyof WindowEventMap>(
  type: Type,
  fn: (event: WindowEventMap[Type]) => void,
) => createEffect(() => createListener(type, fn));
