import { ButtonIcon } from '@components/buttons/ButtonIcon/ButtonIcon.js';
import { useTheme } from '@logic/Theme/useTheme.js';
import { createMemo, on } from 'solid-js';

export const ThemeButton = () => {
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
