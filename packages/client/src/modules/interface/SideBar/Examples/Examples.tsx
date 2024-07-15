import { TextField } from '@components/forms/TextField/TextField.js';
import { Accessor, createEffect, createMemo, createSignal, onCleanup, Show } from 'solid-js';
import { Search } from '@logic/Search/Search.js';
import { createQueryable } from '@logic/createQueryable.js';
import { ExampleNs } from '@modules/managment/exampleNs.js';
import { CollapseButton } from '@modules/interface/SideBar/Examples/CollapseButton.js';
import { Accordion, AccordionItem } from '@shared/components/control/Accordion/Accordion.jsx';
import { Path } from 'a-path';
import { SideBarItems } from '@modules/interface/SideBar/SideBar.items.js';
import { useContent } from '@modules/managment/useContent.js';
import { createEffectListener } from '@logic/createListener.js';
import { ExampleName } from '@modules/renderer/examples/examples.js';
import { Shortcut } from '@components/forms/Shortcut/Shortcut.js';

const FocusShortcut = () => (
  <Shortcut class="absolute right-0 pr-1 opacity-50">
    <Shortcut.Key border>ctrl</Shortcut.Key>
    <Shortcut.Key border>alt</Shortcut.Key>
    <Shortcut.Key>f</Shortcut.Key>
  </Shortcut>
);

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

const cleanupSearch = () =>
  Search.clears([ExampleNs.Search.SelectedId, ExampleNs.Search.CollapseId, ExampleNs.Search.QueryId]);

const createSideBarSearch = (items: Accessor<AccordionItem[]>) => {
  const [results, get, set] = createQueryable(items(), {
    initialQuery: Search.get(ExampleNs.Search.QueryId) ?? '',
    keys: ['title'],
    recursiveBy: 'children',
    threshold: 0.2,
  });

  const filtered = createMemo(() => findNested(items(), new Set(flatBy(results(), 'children'))));
  const isFiltered = createMemo(() => filtered().length !== items().length);

  return [filtered, isFiltered, get, set] as const;
};

const CollapsedItems = flatBy(SideBarItems, 'children')
  .filter(x => !x.children)
  .sort((a, b) => a.title.localeCompare(b.title));

const GoldenItems = flatBy(SideBarItems, 'children')
  .filter(x => !x.children)
  .filter(x => x.masterdisk);

export const Examples = () => {
  onCleanup(cleanupSearch);
  const { selectedExample, selectExample, isCollapsed } = useContent();

  const items = createMemo(() => (isCollapsed() ? CollapsedItems : SideBarItems));
  const [examples, isFiltered, query, setQuery] = createSideBarSearch(items);

  createEffect(() => {
    const item = AccordionItem.findOnlyId(examples());
    if (item) selectExample(item.id as ExampleName);
  });

  let searchRef!: HTMLInputElement;
  createEffectListener('keydown', ({ key, ctrlKey, altKey }) => {
    if (key === 'Enter') {
      const found = AccordionItem.searchWithin(query(), items());

      if (found) selectExample(found.id as ExampleName);
    } else if (key === 'Escape') {
      if (query() === '') {
        selectExample('');
        searchRef.blur();
      } else {
        setQuery('');
      }
    }

    if (ctrlKey && altKey && key === 'f') {
      searchRef.focus();
    }
  });

  const [isFocused, setIsFocused] = createSignal(false);

  return (
    <div class="flex flex-col gap-1 h-full">
      <div class="flex flex-col gap-1 px-2">
        <TextField
          ref={searchRef}
          searchId={ExampleNs.Search.QueryId}
          icon="FaSolidMagnifyingGlass"
          label="search..."
          value={query()}
          onChange={setQuery}
          onFocusChange={setIsFocused}
          after={
            <Show when={!isFocused()}>
              <FocusShortcut />
            </Show>
          }
        />
        <div class="flex justify-between gap-2">
          <span class="center gap-1 text-sm text-primary-7">
            visible:
            <span class="center text-sm text-primary-9">
              {examples().length}/{CollapsedItems.length}/<span class="text-golden-3">{GoldenItems.length}</span>
            </span>
          </span>
          <CollapseButton />
        </div>
      </div>
      <Accordion
        items={examples()}
        selected={selectedExample()}
        onSelectChange={example => example && selectExample(example as ExampleName)}
        expanded={isFiltered()}
      />
    </div>
  );
};
