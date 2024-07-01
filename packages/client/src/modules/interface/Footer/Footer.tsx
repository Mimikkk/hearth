import { GithubButton } from '@modules/interface/Footer/GithubButton.js';
import { WebGpuButton } from '@modules/interface/Footer/WebGpuButton.js';
import { ThemeButton } from '@modules/interface/Footer/ThemeButton.js';
import cx from 'clsx';
import { DevelopmentToolsButton } from '@modules/development/DevelopmentToolsButton.js';
import { Devtools } from '@modules/development/devtools.js';

interface FooterProps {
  class?: string;
}

export const Footer = (props: FooterProps) => (
  <footer class={cx(props.class, 'relative flex gap-2 justify-between')}>
    <div class="select-none flex items-center gap-1">
      <GithubButton />
      <WebGpuButton />
      Prototype
    </div>
    <div class="relative center gap-2">
      <DevelopmentToolsButton
        class={cx(
          Devtools.active() &&
            'fixed bottom-[598px] z-10 bg-primary-white border-2 border-b-primary-white p-1 rounded-t-sm',
        )}
      />
      <ThemeButton />
    </div>
  </footer>
);
