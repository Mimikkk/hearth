import { TextField } from '@components/forms/TextField/TextField.js';
import { createMemo, createSignal, For, onCleanup, Show } from 'solid-js';
import { Search } from '@logic/Search/Search.js';
import { ButtonIcon } from '@components/buttons/ButtonIcon/ButtonIcon.js';
import { IconName } from '@components/buttons/Icon/Icon.js';
import cx from 'clsx';
import { createQueryable } from '@logic/createQueryable.js';
import { Example } from '@modules/managment/example.js';
import { PreviewButton } from '@modules/interface/SideBar/Examples/PreviewButton.js';
import { CollapseButton } from '@modules/interface/SideBar/Examples/CollapseButton.js';
import { createToggle } from '@logic/createToggle.js';
import { paused } from '@utils/paused.js';

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
      <Accordion items={filtered()} />
    </div>
  );
};

interface AccordionItem {
  icon?: IconName;
  title: string;
  id: string;
  children?: AccordionItem[];
}

export interface AccordionProps {
  items: AccordionItem[];
  class?: string;
}

type WithPath = {
  icon?: IconName;
  title: string;
  id: string;
  path: string;
  children?: WithPath[];
};
const assignPath = (item: AccordionItem, path: string = ''): WithPath => ({
  children: item.children ? assignPaths(item.children, path + '.' + item.id) : undefined,
  title: item.title,
  icon: item.icon,
  id: item.id,
  path: path + '.' + item.id,
});

const assignPaths = (items: AccordionItem[], path: string = ''): WithPath[] =>
  items.map(item => assignPath(item, path));

const isSomeSelected = (selected?: string, items: WithPath[]): boolean =>
  !selected ||
  items.some(({ children, path }) => path === selected || (children && isSomeSelected(selected, children)));

const Accordion = (props: AccordionProps) => {
  const [selected, select] = createSignal<string>();

  const items = createMemo(() => assignPaths(props.items));

  const Item = (item: WithPath) => {
    const [expanded, , toggleExpand] = createToggle(false);

    return (
      <li
        class={cx('flex flex-col gap-1 group peer')}
        onClick={paused(() => {
          if (!item.children) return select(item.path);

          if (expanded() && isSomeSelected(selected(), item.children)) select(undefined);
          toggleExpand();
        })}
      >
        <div
          class={cx(
            'cursor-pointer transition-all flex justify-between p-1 rounded-sm select-none',
            selected() === item.path
              ? 'bg-accent-5 hover:bg-accent-4 active:bg-accent-3'
              : 'hover:bg-accent-4 active:bg-accent-3 active',
          )}
        >
          <div class="flex gap-2">
            <Show when={item.icon}>
              <ButtonIcon size="sm" variant="text" icon={item.icon!} />
            </Show>
            <span>{item.title}</span>
          </div>
          <Show when={item.children}>
            <ButtonIcon
              class={expanded() ? 'rotate-0' : 'rotate-90'}
              size="sm"
              variant="text"
              icon="CgChevronDown"
              onClick={paused(toggleExpand)}
            />
          </Show>
        </div>
        <ul
          class={cx(
            'ml-4 grid transition-[grid-template-rows] duration-100',
            expanded() ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
          )}
        >
          <div class="overflow-hidden">
            <For each={item.children!} children={Item} />
          </div>
        </ul>
      </li>
    );
  };

  return (
    <ul class={cx('flex flex-col h-full overflow-auto px-2', props.class)}>
      <For each={items()} children={Item} />
    </ul>
  );
};
