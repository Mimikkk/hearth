import { createMemo, on } from "solid-js";
import { ButtonIcon } from "../../components/buttons/ButtonIcon.tsx";
import { useTheme } from "../../shared/logic/theme/useTheme.tsx";

export const ThemeButton = () => {
  const theme = useTheme();

  const icon = createMemo(
    on(theme.get, (mode) => {
      if (mode === "light") return "CgSun";
      if (mode === "dark") return "CgMoon";
      return "SiCompilerexplorer";
    }),
  );
  const title = createMemo(
    on(theme.next, (mode) => {
      if (mode === "light") return "Switch to light mode";
      if (mode === "dark") return "Switch to dark mode";
      return "Switch to system mode";
    }),
  );

  return <ButtonIcon variant="text" onclick={theme.toggle} icon={icon()} title={title()} />;
};
