import { createMemo, createRenderEffect } from "solid-js";
import { createStorageSignal } from "../../createStorageSignal.tsx";

export const createTheme = (key: string) => {
  const system = globalThis.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const [get, set] = createStorageSignal<undefined | "dark" | "light">({ key });

  createRenderEffect(() => {
    const list = document.documentElement.classList;
    const theme = get() ?? system;

    list.remove(theme === "dark" ? "light" : "dark");
    list.add(theme);
  });

  const next = createMemo(() => {
    const theme = get();

    if (system === "dark") {
      if (theme === undefined) {
        return "light";
      } else if (theme === "light") {
        return "dark";
      } else if (theme === "dark") {
        return undefined;
      }
    } else {
      if (theme === undefined) {
        return "dark";
      } else if (theme === "dark") {
        return "light";
      } else if (theme === "light") {
        return undefined;
      }
    }
  });

  return {
    get,
    mode: createMemo(() => get() ?? system),
    system,
    set,
    next,
    toggle: () => set(next()),
  };
};
