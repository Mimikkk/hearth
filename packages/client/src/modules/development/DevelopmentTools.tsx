import s from './DevelopmentTools.module.scss';
import { AvailableIconsTab } from '@modules/development/Tabs/AvailableIcons.tab.js';
import { Devtools } from '@modules/development/devtools.js';
import { Tabulator } from '@components/control/Tabulator/Tabulator.js';
import '@modules/renderer/threejs/nodes/Nodes.js';
import { NodeClasses } from '@modules/renderer/threejs/nodes/core/Node.js';

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
                title: 'Available icons',
                children: AvailableIconsTab,
              },
              {
                id: 'tab-2',
                title: 'Log available nodes',
                onClick: () => console.log({ NodeClasses }),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
};
