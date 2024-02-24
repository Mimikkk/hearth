import type { IconName } from '@components/buttons/Icon/Icon.js';
import { createSignal, For, JSX, mergeProps } from 'solid-js';
import { createSearchStorageString } from '@logic/SearchStorage/createSearchStorageString.js';
import cx from 'clsx';
import s from './Tabulator.module.scss';
import { Dynamic } from 'solid-js/web';

export interface TabItem {
  icon?: IconName;
  id: string;
  title: string;
  children: () => JSX.Element;
  class?: string;
}

export type TabulatorProps = ({ id: string } | { storageId: string; searchId: string }) & {
  tabs: TabItem[];
  class?: string;
  default?: string;
  tabclass?: string;
  navclass?: string;
  contentclass?: string;
};

export const Tabulator = (props: TabulatorProps) => {
  const $ = mergeProps({ default: props.tabs[0].id }, props);

  const [selected, select] =
    'id' in $ ? createSignal($.default) : createSearchStorageString($.searchId, $.storageId, $.default);

  return (
    <div class={cx(s.tabulator, $.class)}>
      <div class={cx(s.nav, $.navclass)}>
        <For each={$.tabs}>
          {tab => (
            <div onClick={() => select(tab.id)} class={cx(s.navtab, $.tabclass, selected() === tab.id && s.selected)}>
              <div class={cx(s.text, selected() === tab.id && s.selected)}>{tab.title}</div>
            </div>
          )}
        </For>
      </div>

      <div class={$.contentclass}>
        <Dynamic component={$.tabs.find(tab => tab.id === selected())?.children} />
      </div>
    </div>
  );
};
