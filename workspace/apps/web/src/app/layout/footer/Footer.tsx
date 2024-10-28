import cx from "clsx";
import { GithubButton } from "./GithubButton.tsx";
import { ThemeButton } from "./ThemeButton.tsx";
import { WebGpuButton } from "./WebGpuButton.tsx";
import { DevelopmentToolsButton } from "./devtools/DevtoolsButton.tsx";
import { useDevTools } from "./devtools/useDevtools.tsx";

interface FooterProps {
  class?: string;
}

export const Footer = (props: FooterProps) => {
  const devtools = useDevTools();

  return (
    <footer class={cx(props.class, "relative flex gap-2 justify-between")}>
      <div class="select-none flex items-center gap-1">
        <GithubButton />
        <WebGpuButton />
        Hearth
      </div>
      <div class="relative center gap-2">
        <DevelopmentToolsButton
          class={cx(
            devtools.active() &&
              "fixed bottom-[598px] z-10 bg-primary-white border-2 border-b-primary-white p-1 rounded-t-sm",
          )}
        />
        <ThemeButton />
      </div>
    </footer>
  );
};
