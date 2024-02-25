import { ButtonIcon } from '@components/buttons/ButtonIcon/ButtonIcon.js';
import s from './DevelopmentTools.module.scss';
import { AvailableIconsTab } from '@modules/development/Tabs/AvailableIcons.tab.js';
import { Devtools } from '@modules/development/devtools.js';
import { Tabulator } from '@components/control/Tabulator/Tabulator.js';
import cx from 'clsx';

export const DevelopmentTools = () => {
  Devtools.createKeyboardShortcut();

  return (
    <div class={s.tools}>
      <div class={cx('fixed border top-0 p-1 pt-0 rounded-br-sm border-t-0 border-l-0 left-52')}>
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
    </div>
  );
};
