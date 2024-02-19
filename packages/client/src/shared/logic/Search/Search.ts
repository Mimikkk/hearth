import { createSignal } from "solid-js";

export namespace Search {
  export const read = () => new URL(window.location.href).searchParams;

  export const [params, set] = createSignal(read());
  window.addEventListener("popstate", () => set(read()));

  export const update = (fn: (params: URLSearchParams) => void) =>
    set((params) => {
      fn(params);

      window.history.pushState(null, "", `?${params}`);

      return new URLSearchParams(params);
    });
}
