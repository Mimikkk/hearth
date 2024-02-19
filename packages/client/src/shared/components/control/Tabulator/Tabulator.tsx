import type { IconName } from '@components/buttons/Icon/Icon.js';
import type { JSX } from 'solid-js';
import { For, mergeProps } from 'solid-js';
import { createSearchStorageString } from '@logic/SearchStorage/createSearchStorageString.js';
import cx from 'clsx';
import s from './Tabulator.module.scss';

export interface TabItem {
  icon?: IconName;
  id: string;
  title: string;
  children: () => JSX.Element;
  class?: string;
}

export interface TabulatorProps {
  searchId: string;
  storageId: string;
  tabs: TabItem[];
  tabclass?: string;
  navclass?: string;
  class?: string;
  default?: string;
}

export const Tabulator = (props: TabulatorProps) => {
  const $ = mergeProps({ default: props.tabs[0].id }, props);
  const [selected, select] = createSearchStorageString($.searchId, $.storageId, $.default);

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
      {$.tabs.find(tab => tab.id === selected())?.children()}
    </div>
  );
};
