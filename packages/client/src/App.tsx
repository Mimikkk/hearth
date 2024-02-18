import { ThemeProvider, useTheme } from '@logic/Theme/useTheme.js';
import { ButtonIcon } from '@components/buttons/ButtonIcon/ButtonIcon.js';
import { TextField } from '@components/forms/TextField/TextField.js';
import { Button } from '@components/buttons/Button/Button.js';

const Layout = () => {
  const theme = useTheme();

  return (
    <main>
      <Button variant="contained">Lets Go</Button>
      <Button variant="outlined">Lets Go</Button>
      <ButtonIcon variant="contained" icon={'AiFillAlert'} />
      <ButtonIcon variant="text" icon={'AiFillAlert'} />
      <button onclick={theme.toggle}>123</button>
      <div>Left SideBar</div>
      <div>Content Demo</div>
      <div>SideBar</div>
      <TextField label="abc" class="bg-primary-3" />
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
