import { createContext } from "../createContext.tsx";
import { createTheme } from "./createTheme.tsx";

interface UseTheme {
  key: string;
}
export const [useTheme, ThemeProvider] = createContext((props: UseTheme) => createTheme(props.key));
