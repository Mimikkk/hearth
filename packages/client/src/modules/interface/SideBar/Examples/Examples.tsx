import { TextField } from '@components/forms/TextField/TextField.js';
import { createSignal, For, onCleanup, Show } from 'solid-js';
import { Search } from '@logic/Search/Search.js';
import { ButtonIcon } from '@components/buttons/ButtonIcon/ButtonIcon.js';
import { SearchStorage } from '@logic/SearchStorage/SearchStorage.js';
import { IconName } from '@components/buttons/Icon/Icon.js';
import cx from 'clsx';
import { createQueryable } from '@logic/createQueryable.js';

const QueryId = 'query';
const SelectedId = 'selected';
const ModeId = 'mode';
const PreviewId = 'preview';
const CollapseId = 'collapse';

const CollapseButton = () => {
  const [isCollapsed, , toggleCollapsed] = SearchStorage.bool(CollapseId, 'example-collapse', false);

  return (
    <ButtonIcon
      variant="text"
      cross={isCollapsed()}
      icon="BiRegularCategory"
      onClick={toggleCollapsed}
      title={isCollapsed() ? 'show all examples' : 'collapse examples'}
    />
  );
};

const PreviewButton = () => {
  const [isPreview, , togglePreview] = SearchStorage.bool(PreviewId, 'example-preview', true);

  return (
    <ButtonIcon
      variant="text"
      cross={isPreview()}
      icon="HiSolidViewfinderCircle"
      onClick={togglePreview}
      title={isPreview() ? 'hide preview image' : 'show preview image'}
    />
  );
};

const items: AccordionItem[] = [
  {
    title: 'Category - 1',
    icon: 'BiRegularCategory',
    id: 'a',
    children: [
      {
        title: 'Category - 1.1',
        icon: 'BiRegularCategory',
        id: 'b',
        children: [
          {
            icon: 'BiRegularCategory',
            title: 'Category - 1.1.1',
            id: 'a',
          },
          {
            title: 'Category - 1.1.2',
            icon: 'BiRegularCategory',
            id: 'b',
          },
        ],
      },
    ],
  },
  {
    title: 'Category - 2',
    icon: 'BiRegularCategory',
    id: 'b',
  },
  {
    title: 'Category - 3',
    icon: 'BiRegularCategory',
    id: 'c',
  },
];
export const Examples = () => {
  onCleanup(() => Search.clears([QueryId, ModeId, PreviewId, CollapseId, SelectedId]));

  function flatten(items: AccordionItem[]): { item: AccordionItem; title: string }[] {
    const flattened = [];
    const stack = items.map(item => [item, item.title] as const);

    while (stack.length) {
      const [item, title] = stack.pop()!;
      flattened.push({ item, title });

      if (item.children) stack.push(...item.children.map(child => [child, title + ' ' + child.title] as const));
    }

    return flattened;
  }

  const [list, get, set] = createQueryable(flatten(items), {
    keys: ['title'],
  });

  return (
    <div class="flex flex-col gap-1">
      <TextField searchId={QueryId} icon="FaSolidMagnifyingGlass" label="search..." value={get()} onChange={set} />
      <div class="flex ml-auto gap-2">
        <CollapseButton />
        <PreviewButton />
      </div>
      <Accordion items={items} />
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

type WithPath = AccordionItem & { path: string };
const assignPath = (item: AccordionItem, path: string = ''): WithPath => ({
  children: item.children ? assignPaths(item.children, path + '.' + item.id) : undefined,
  title: item.title,
  icon: item.icon,
  id: item.id,
  path: path + '.' + item.id,
});

const assignPaths = (items: AccordionItem[], path: string = ''): WithPath[] =>
  items.map(item => assignPath(item, path));

const Accordion = (props: AccordionProps) => {
  const [selected, select] = createSignal();
  const items = assignPaths(props.items);

  const Item = (item: WithPath) => {
    return (
      <li
        class={cx('flex flex-col', selected() === item.path && 'bg-accent-1')}
        onClick={event => {
          event.stopPropagation();
          event.preventDefault();

          select(item.path);
        }}
      >
        <div class="flex gap-2">
          <Show when={item.icon}>
            <ButtonIcon size="sm" variant="text" icon={item.icon!} />
          </Show>
          <span>{item.title}</span>
        </div>
        <ul class="ml-4 flex flex-col gap-1">
          <For each={item.children!} children={Item} />
        </ul>
      </li>
    );
  };

  return (
    <ul class={cx('flex flex-col gap-1', props.class)}>
      <For each={items} children={Item} />
    </ul>
  );
};
