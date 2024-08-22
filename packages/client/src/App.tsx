import { ThemeProvider } from '@logic/Theme/useTheme.js';
import { ContentProvider } from '@modules/managment/useContent.js';
import { Layout } from '@modules/interface/Layout.js';

export const App = () => (
  <ThemeProvider key="theme-mode">
    <ContentProvider>
      <Layout />
    </ContentProvider>
  </ThemeProvider>
);
