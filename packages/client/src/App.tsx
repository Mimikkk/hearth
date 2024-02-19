import { ThemeProvider } from '@logic/Theme/useTheme.js';
import { Layout } from '@modules/interface/Layout.js';
import { ContentProvider } from '@modules/managment/useContent.js';

export const App = () => (
  <ThemeProvider key="dark-mode">
    <ContentProvider>
      <Layout />
    </ContentProvider>
  </ThemeProvider>
);
