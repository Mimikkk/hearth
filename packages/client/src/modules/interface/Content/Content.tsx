import { ButtonIcon } from '@components/buttons/ButtonIcon/ButtonIcon.js';
import cx from 'clsx';
import { SearchStorage } from '@logic/SearchStorage/SearchStorage.js';
import { Canvas } from '@modules/interface/Content/Canvas.js';

interface ContentProps {
  class?: string;
}

const ShowCodeButton = () => {
  const [showCode, , toggleCode] = SearchStorage.bool('code', 'show-code', false);

  return (
    <div class="absolute right-2 bottom-1.5">
      <ButtonIcon cross={showCode()} variant="text" icon="VsCode" onClick={toggleCode} />
    </div>
  );
};

export const Content = (props: ContentProps) => {
  return (
    <div class={cx(props.class, 'w-full h-full relative')}>
      <ShowCodeButton />
      <Canvas />
    </div>
  );
};
