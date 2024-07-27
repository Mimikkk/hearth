import { Tabulator } from '@components/control/Tabulator/Tabulator.js';
import { Examples } from '@modules/interface/SideBar/Examples/Examples.js';
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
        id="tabs"
        default="examples"
        tabs={[
          {
            id: 'examples',
            title: 'Examples',
            children: Examples,
          },
        ]}
        class={props.class}
        contentclass="py-2"
      />
      <DragCorner onDoubleClick={drag.reset} onDrag={drag.start} type="right" />
    </div>
  );
};
