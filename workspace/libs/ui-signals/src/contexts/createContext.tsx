import type { JSXElement, ParentProps } from "solid-js";
import { createContext as createSolidContext, splitProps, useContext } from "solid-js";

export const createContext = <State, Args extends Record<string, any>>(
  provider: (props: Args) => State,
  initial?: State,
): [() => State, (props: ParentProps<Args>) => JSXElement] => {
  const Context = createSolidContext(undefined as State);

  return [
    () => {
      const context = useContext(Context);

      if (context === undefined) {
        if (initial !== undefined) return initial;
        throw Error("useContext must be used within a Provider");
      }

      return context;
    },
    (props) => {
      const [$, other] = splitProps(props, ["children"]);

      return <Context.Provider value={provider(other as Args)}>{$.children}</Context.Provider>;
    },
  ];
};
