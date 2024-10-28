import { SplitPanel } from "./components/containers/SplitPanel/SplitPanel.tsx";
import { Content } from "./layout/content/Content.tsx";
import { DevToolsProvider } from "./layout/footer/devtools/useDevtools.tsx";
import { Footer } from "./layout/footer/Footer.tsx";
import { Sidebar } from "./layout/sidebar/Sidebar.tsx";
import { ThemeProvider } from "./shared/logic/theme/useTheme.tsx";

export const App = () => (
  <ThemeProvider key="theme-mode">
    <DevToolsProvider key="active-devtool">
      <div class="relative flex flex-col h-full w-full">
        <SplitPanel
          class="h-full"
          first={<Sidebar />}
          second={<Content class="flex-1" />}
          direction="horizontal"
        />
        <Footer />
      </div>
    </DevToolsProvider>
  </ThemeProvider>
);
