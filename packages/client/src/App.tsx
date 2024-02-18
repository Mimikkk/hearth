import { ThemeProvider, useTheme } from '@logic/Theme/useTheme.js';

const Layout = () => {
  const theme = useTheme();

  return (
    <main>
      <button onclick={theme.toggle}>123</button>
      <div>Left SideBar</div>
      <div>Content Demo</div>
      <div>SideBar</div>
      <div>
        Right SideBar
        <div>Engine State</div>
        <div>Game State</div>
      </div>
    </main>
  );
};

export const App = () => (
  <ThemeProvider key="dark-mode">
    <Layout />
  </ThemeProvider>
);
