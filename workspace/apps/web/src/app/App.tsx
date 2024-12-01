import { ThemeProvider } from "@mimi/ui-signals";
import { Content } from "./layout/content/Content.tsx";
import { DevToolsProvider } from "./layout/footer/devtools/useDevtools.tsx";
import { Footer } from "./layout/footer/Footer.tsx";
import { Sidebar } from "./layout/sidebar/Sidebar.tsx";

export const App = () => (
  <ThemeProvider key="theme-mode">
    <DevToolsProvider key="active-devtool">
      <div class="relative flex flex-col h-full w-full">
        <Sidebar />
        <Content class="grow" />
        <Footer />
      </div>
    </DevToolsProvider>
  </ThemeProvider>
);
