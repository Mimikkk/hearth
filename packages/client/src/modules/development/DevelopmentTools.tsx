import { ButtonIcon } from '@components/buttons/ButtonIcon/ButtonIcon.js';
import s from './DevelopmentTools.module.scss';
import { AvailableIconsTab } from '@modules/development/Tabs/AvailableIcons.tab.js';
import { Devtools } from '@modules/development/devtools.js';
import { Tabulator } from '@components/control/Tabulator/Tabulator.js';
import cx from 'clsx';
import { createStorageSignal } from '@logic/Storage/createStorageSignal.js';
import { DragCorner } from '@components/control/DragCorner/DragCorner.js';
import { createResizer, Resizer } from '@logic/createResizer.js';
import { createMover, Mover } from '@logic/createMover.js';

export const DevelopmentToolsButton = () => {
  const [size, setSize] = createStorageSignal<{
    width: string;
    height: string;
  } | null>('devtools-size', null);

  const [transform, setTransform] = createStorageSignal<string | null>('devtools-transform', null);

  const saveResize: Resizer.Handler = ({ style: { height, width } }) => setSize({ height, width });
  const saveMove: Mover.Handler = ({ style: { transform } }) => setTransform(transform);

  const bottomRightResizer = createResizer({ onEnd: saveResize });
  const bottomResizer = createResizer({ onEnd: saveResize, horizontal: false });
  const rightResizer = createResizer({ onEnd: saveResize, vertical: false });
  const mover = createMover({ onEnd: saveMove, vertical: false });

  return (
    <div
      ref={ref => {
        bottomRightResizer.target.ref = ref;
        bottomResizer.target.ref = ref;
        rightResizer.target.ref = ref;
        mover.target.ref = ref;

        const o = size();
        if (!o) return;
        ref.style.width = o.width;
        ref.style.height = o.height;
        const t = transform();
        if (!t) return;

        ref.style.transform = t;
      }}
      class={cx(
        'fixed transition-colors border-2 top-24 left-56 max-w-40 max-h-40 min-w-8 min-h-8 rounded-b-sm bg-primary-white p-1 center cursor-move',
        Devtools.active() && 'border-accent-5 bg-primary-2',
      )}
      onPointerDown={mover.start}
      onDblClick={mover.reset}
    >
      <ButtonIcon
        cross={Devtools.active()}
        icon="CgToolbox"
        variant="text"
        class={s.expander}
        onClick={Devtools.toggle}
      />
      <DragCorner onDoubleClick={rightResizer.reset} onDrag={rightResizer.start} type="right" />
      <DragCorner onDoubleClick={bottomResizer.reset} onDrag={bottomResizer.start} type="bottom" />
      <DragCorner onDoubleClick={bottomRightResizer.reset} onDrag={bottomRightResizer.start} type="bottom-right" />
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
