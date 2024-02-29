import { Tabulator } from '@components/control/Tabulator/Tabulator.js';
import { Examples } from '@modules/interface/SideBar/Examples/Examples.js';
import { Docs } from '@modules/interface/SideBar/Docs/Docs.js';
import { createResizer } from '@logic/createResizer.js';
import { DragCorner } from '@components/control/DragCorner/DragCorner.js';
import cx from 'clsx';

interface SideBarProps {
  class?: string;
}

export const SideBar = (props: SideBarProps) => {
  const drag = createResizer({
    vertical: false,
  });

  return (
    <div ref={drag.target.ref} class={cx('bg-background-2 relative min-w-4 w-52 max-w-80 flex-shrink-0', props.class)}>
      <Tabulator
        searchId="tab"
        storageId="selected-tab"
        tabs={[
          {
            id: 'docs',
            title: 'Docs',
            children: Docs,
          },
          {
            id: 'examples',
            title: 'Examples',
            children: Examples,
          },
        ]}
        class={props.class}
      />
      <DragCorner onDoubleClick={drag.reset} onDrag={drag.start} type="right" />
    </div>
  );
};
