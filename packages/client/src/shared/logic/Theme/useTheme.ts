import { createTheme } from '@logic/Theme/createTheme.js';
import { createContext } from '@logic/createContext.js';

interface UseTheme {
  key: string;
}
export const [useTheme, ThemeProvider] = createContext((props: UseTheme) => createTheme(props.key));
