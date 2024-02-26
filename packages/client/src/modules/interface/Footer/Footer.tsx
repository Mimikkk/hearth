import { GithubButton } from '@modules/interface/Footer/GithubButton.js';
import { WebGpuButton } from '@modules/interface/Footer/WebGpuButton.js';
import { ThemeButton } from '@modules/interface/Footer/ThemeButton.js';
import cx from 'clsx';

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
    <ThemeButton />
  </footer>
);
