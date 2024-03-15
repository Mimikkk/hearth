import { TextField } from '@components/forms/TextField/TextField.js';
import { createMemo, onCleanup } from 'solid-js';
import { Search } from '@logic/Search/Search.js';
import { createQueryable } from '@logic/createQueryable.js';
import { Example } from '@modules/managment/example.js';
import { PreviewButton } from '@modules/interface/SideBar/Examples/PreviewButton.js';
import { CollapseButton } from '@modules/interface/SideBar/Examples/CollapseButton.js';
import { Accordion, AccordionItem } from '@shared/components/control/Accordion/Accordion.jsx';
import { Path } from 'a-path';
import { SideBarItems } from '@modules/interface/SideBar/SideBar.items.js';
import { useContent } from '@modules/managment/useContent.js';

const flatBy = <T extends Record<string, any>>(items: T[], key: Path.Of<T, T[] | undefined>): T[] => {
  const results = [];
  const stack = [...items];

  while (stack.length) {
    const item = stack.pop()!;

    results.push(item);

    const children = Path.get(item, key);
    if (children) stack.push(...(children as T[]));
  }

  return results;
};

const findNested = (items: AccordionItem[], filtered: Set<AccordionItem>) => {
  const visible: AccordionItem[] = [];

  for (const item of items) {
    let { id, title, children, icon } = item;

    if (children) {
      children = findNested(children, filtered);
      if (!children.length) continue;

      visible.push({ id, icon, title, children });
    } else if (filtered.has(item)) visible.push(item);
  }

  return visible;
};

export const Examples = () => {
  const { selected, select } = useContent();

  onCleanup(() =>
    Search.clears([
      Example.Search.SelectedId,
      Example.Search.CollapseId,
      Example.Search.PreviewId,
      Example.Search.QueryId,
    ]),
  );

  const [results, get, set] = createQueryable(SideBarItems, { keys: ['title'], recursiveBy: 'children' });
  const filtered = createMemo(() => findNested(SideBarItems, new Set(flatBy(results(), 'children'))));

  return (
    <div class="flex flex-col gap-1 h-full">
      <div class="flex flex-col gap-1 px-2">
        <TextField
          searchId={Example.Search.QueryId}
          icon="FaSolidMagnifyingGlass"
          label="search..."
          value={get()}
          onChange={set}
        />
        <div class="flex ml-auto gap-2">
          <CollapseButton />
          <PreviewButton />
        </div>
      </div>
      <Accordion items={filtered()} selected={selected()} onSelect={select} expanded />
    </div>
  );
};
