import { ButtonIcon } from '@components/buttons/ButtonIcon/ButtonIcon.js';
import cx from 'clsx';
import { Canvas } from '@modules/interface/Content/Canvas.js';
import { useContent } from '@modules/managment/useContent.js';

interface ContentProps {
  class?: string;
}

export const Content = (props: ContentProps) => {
  const { showCode, toggleCode } = useContent();

  return (
    <div class={cx(props.class, 'w-full h-full relative overflow-hidden')}>
      <div class="z-10 absolute right-2 bottom-1">
        <ButtonIcon cross={showCode()} variant="text" icon="VsCode" onClick={toggleCode} />
      </div>
      <Canvas />
    </div>
  );
};
