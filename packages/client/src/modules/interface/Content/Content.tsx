import { ButtonIcon } from '@components/buttons/ButtonIcon/ButtonIcon.js';
import cx from 'clsx';
import { Canvas } from '@modules/interface/Content/Canvas.js';
import { useContent } from '@modules/managment/useContent.js';

interface ContentProps {
  class?: string;
}

const CodeButton = () => {
  const { showCode, toggleCode } = useContent();

  return (
    <div class="z-10 absolute bottom-2 right-2">
      <ButtonIcon cross={showCode()} variant="text" icon="VsCode" onClick={toggleCode} />
    </div>
  );
};

export const Content = (props: ContentProps) => (
  <div class={cx(props.class, 'w-full h-full relative overflow-hidden')}>
    <CodeButton />
    <Canvas />
  </div>
);
