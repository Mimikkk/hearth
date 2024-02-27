import { ButtonIcon } from '@components/buttons/ButtonIcon/ButtonIcon.js';
import s from './DevelopmentTools.module.scss';
import { AvailableIconsTab } from '@modules/development/Tabs/AvailableIcons.tab.js';
import { Devtools } from '@modules/development/devtools.js';
import { Tabulator } from '@components/control/Tabulator/Tabulator.js';
import { createEffect, createMemo } from 'solid-js';
import { createStorageSignal } from '@logic/Storage/createStorageSignal.js';
import { createResizeV1 } from '@logic/createResizeV1.js';
import cx from 'clsx';

export const DevelopmentToolsButton = () => {
  const [position, setPosition] = createStorageSignal('devtools-offset', { x: 0, y: 0 });
  const drag = createResizeV1();

  createEffect(() => {
    const pos = drag.position();
    if (!pos) return;

    setPosition(pos);
  });

  const dragTransform = createMemo(() => {
    const { x } = position();

    return { transform: `translate(${x}px, 0px)` };
  });

  return (
    <div
      onPointerDown={drag.onDown}
      class={cx(
        'transition-colors fixed border-2 border-t-0 top-0 right-0 p-1 rounded-b-sm bg-primary-white cursor-move',
        Devtools.active() && 'border-accent-5 bg-primary-2',
      )}
      style={dragTransform()}
    >
      <div class={s.expand}>
        <ButtonIcon
          cross={Devtools.active()}
          icon="CgToolbox"
          variant="text"
          class={s.expander}
          onClick={Devtools.toggle}
        />
      </div>
    </div>
  );
};

export const DevelopmentTools = () => {
  Devtools.createKeyboardShortcut();

  return (
    <div class={s.tools}>
      <div class={s.tabs} data-active={Devtools.active()}>
        <div class={s.tabulator}>
          <Tabulator
            id="devtool-tab"
            class="w-full gap-2"
            tabclass="text-white"
            tabs={[
              {
                id: 'tab-1',
                title: 'Available Icons',
                children: AvailableIconsTab,
                icon: 'CgAdd',
              },
            ]}
          />
        </div>
      </div>
      <DevelopmentToolsButton />
    </div>
  );
};
