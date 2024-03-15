import { ButtonIcon } from '@components/buttons/ButtonIcon/ButtonIcon.js';
import cx from 'clsx';
import { SearchStorage } from '@logic/SearchStorage/SearchStorage.js';
import { Canvas } from '@modules/interface/Content/Canvas.js';
interface ContentProps {
  class?: string;
}

export const Content = (props: ContentProps) => {
  const [showCode, , toggleCode] = SearchStorage.bool('code', 'show-code', false);

  return (
    <div class={cx(props.class, 'w-full h-full relative')}>
      <div class="absolute left-2">
        <ButtonIcon cross={showCode()} variant="text" icon="VsCode" onClick={toggleCode} />
      </div>
      <Canvas />
    </div>
  );
};
