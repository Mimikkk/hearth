import { ThemeProvider, useTheme } from '@logic/Theme/useTheme.js';
import { ButtonIcon } from '@components/buttons/ButtonIcon/ButtonIcon.js';
import { Button } from '@components/buttons/Button/Button.js';
import { createMemo, on } from 'solid-js';

const ThemeButton = () => {
  const theme = useTheme();

  const icon = createMemo(
    on(theme.mode, mode => {
      if (mode === 'light') return 'CgSun';
      if (mode === 'dark') return 'CgMoon';
      return 'SiCompilerexplorer';
    }),
  );
  const title = createMemo(
    on(theme.next, mode => {
      if (mode === 'light') return 'Switch to Light Mode';
      if (mode === 'dark') return 'Switch to Dark Mode';
      return 'Switch to System Mode';
    }),
  );

  return <ButtonIcon variant="text" onclick={theme.toggle} icon={icon()} title={title()} />;
};

const Layout = () => {
  return (
    <main class="grid grid-cols-6 gap-2">
      <div class="col-span-full">
        <ThemeButton />
      </div>
      <div class="col-span-1">Left</div>
      <div class="col-span-4">Center</div>
      <div class="col-span-1">Right</div>
      <Button variant="contained">Lets Go</Button>
      <Button variant="outlined">Lets Go</Button>
      <ButtonIcon variant="contained" icon={'AiFillAlert'} />
      <ButtonIcon variant="text" icon={'AiFillAlert'} />
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
