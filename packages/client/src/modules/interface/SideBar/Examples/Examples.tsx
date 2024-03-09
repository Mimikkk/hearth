import { TextField } from '@components/forms/TextField/TextField.js';
import { createMemo, onCleanup } from 'solid-js';
import { Search } from '@logic/Search/Search.js';
import { createQueryable } from '@logic/createQueryable.js';
import { Example } from '@modules/managment/example.js';
import { PreviewButton } from '@modules/interface/SideBar/Examples/PreviewButton.js';
import { CollapseButton } from '@modules/interface/SideBar/Examples/CollapseButton.js';
import { Accordion, AccordionItem } from '@shared/components/control/Accordion/Accordion.jsx';

const items: AccordionItem[] = [
  {
    title: 'a',
    icon: 'BiRegularCategory',
    id: 'a',
    children: [
      {
        title: 'b',
        icon: 'BiRegularCategory',
        id: 'b',
        children: [
          {
            icon: 'BiRegularCategory',
            title: 'c',
            id: 'a',
          },
          {
            title: 'd',
            icon: 'BiRegularCategory',
            id: 'b',
          },
        ],
      },
    ],
  },
  {
    title: 'e',
    icon: 'BiRegularCategory',
    id: 'b',
    children: [
      {
        title: 'f',
        icon: 'BiRegularCategory',
        id: 'c',
      },
      {
        title: 'f',
        icon: 'BiRegularCategory',
        id: 'd',
      },
    ],
  },
  {
    title: 'f',
    icon: 'BiRegularCategory',
    id: 'c',
  },
];

const flatten = (items: AccordionItem[]): { item: AccordionItem; title: string }[] => {
  const flattened = [];
  const stack = items.map(item => [item, item.title] as const);

  while (stack.length) {
    const [item, title] = stack.pop()!;
    flattened.push({ item, title });

    if (item.children) stack.push(...item.children.map(child => [child, title + ' ' + child.title] as const));
  }

  return flattened;
};

const findNested = (items: AccordionItem[], filtered: Set<AccordionItem>) => {
  const visible: AccordionItem[] = [];

  for (const item of items) {
    if (item.children) {
      const children = findNested(item.children, filtered);
      if (!children.length) continue;

      visible.push({ id: item.id, icon: item.icon, title: item.title, children });
    } else {
      if (filtered.has(item)) visible.push(item);
    }
  }

  return visible;
};

export const Examples = () => {
  onCleanup(() =>
    Search.clears([
      Example.Search.SelectedId,
      Example.Search.CollapseId,
      Example.Search.PreviewId,
      Example.Search.QueryId,
    ]),
  );

  const [queried, get, set] = createQueryable(flatten(items), { keys: ['title'] });
  const filtered = createMemo(() => findNested(items, new Set(queried().map(({ item }) => item))));

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
      <Accordion items={filtered()} expanded />
    </div>
  );
};
