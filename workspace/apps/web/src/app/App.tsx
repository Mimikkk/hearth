import { ThemeProvider } from "@mimi/ui-signals";
import { DevToolsProvider } from "./layout/Devtools/useDevtools.tsx";
import { Layout } from "./layout/Layout.tsx";

export const App = () => (
  <ThemeProvider key="theme-mode">
    <DevToolsProvider key="active-devtool">
      <Layout />
    </DevToolsProvider>
  </ThemeProvider>
);
