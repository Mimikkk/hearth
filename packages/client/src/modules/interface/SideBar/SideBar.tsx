import { Tabulator } from '@components/control/Tabulator/Tabulator.js';
import { Examples } from '@modules/interface/SideBar/Examples/Examples.js';
import { Docs } from '@modules/interface/SideBar/Docs/Docs.js';

interface SideBarProps {
  class?: string;
}

export const SideBar = (props: SideBarProps) => (
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
    contentclass="py-2 px-4"
  />
);
