import { IconName } from '@components/buttons/Icon/Icon.js';
import { Accessor, createEffect, createMemo, createSignal, For, on, Setter, Show } from 'solid-js';
import cx from 'clsx';
import { prevented } from '@utils/prevented.js';
import { ButtonIcon } from '@components/buttons/ButtonIcon/ButtonIcon.js';
import { isEqual } from 'lodash-es';

export interface AccordionItem {
  icon?: IconName;
  title: string;
  id: string;
  children?: AccordionItem[];
}

export namespace AccordionItem {
  export const withChildren = (items: AccordionItem[]): AccordionItem[] => {
    const result = [];

    for (let item of items) {
      if (item.children) result.push(item, ...withChildren(item.children));
    }

    return result;
  };

  export const within = (items: AccordionItem[], id?: string): boolean =>
    !id || items.some(item => id === item.id || (item.children && within(item.children, id)));

  export const findOnlyId = (items: AccordionItem | AccordionItem[]): AccordionItem | null => {
    if (Array.isArray(items)) {
      if (items.length == 1) return findOnlyId(items[0]);
    } else {
      if (!items.children?.length) return items;

      return items.children.length == 1 ? findOnlyId(items.children[0]) : null;
    }

    return null;
  };

  export const findPathTo = (id: string, items: AccordionItem[], path: string[] = []): string[] | null => {
    for (const { children, id: itemId } of items) {
      if (itemId === id) return [...path, id];

      if (!children) continue;
      const found = findPathTo(id, children, [...path, itemId]);
      if (found) return found;
    }

    return null;
  };

  export const searchWithin = (query: string, items: AccordionItem[]): AccordionItem | null => {
    for (const item of items) {
      if (item.title.toLowerCase() === query.toLowerCase()) return item;

      if (item.children) {
        const found = searchWithin(query, item.children);
        if (found) return found;
      }
    }

    return null;
  };
}

export interface AccordionProps {
  onSelectChange?: (id: string | undefined) => void;
  items: AccordionItem[];
  expanded?: boolean;
  selected?: string;
  class?: string;
}

const createToggleMap = () => {
  const [map, setMap] = createSignal(new Map<string, boolean>());

  const set = (id: string, value: boolean) => setMap(map => new Map(map).set(id, value));
  const toggle = (id: string) => set(id, !map().get(id));

  return [map, setMap, set, toggle] as const;
};

const createSettle = <T,>(value: Accessor<T>, get: Accessor<T>, set: Setter<T>) =>
  createEffect(
    on(value, value => {
      if (isEqual(get(), value)) return;
      set(() => value);
    }),
  );

const createSettleSignal = <T,>(value: Accessor<T>) => {
  const [get, set] = createSignal(value());
  createSettle(value, get, set);
  return [get, set] as const;
};

export const Accordion = (props: AccordionProps) => {
  const [expanded, , setExpansion, toggleExpansion] = createToggleMap();
  const [selected, setSelect] = createSettleSignal(() => props.selected);

  const select = (id?: string) => {
    setSelect(id);
    props.onSelectChange?.(id);
  };

  const pathToSelected = createMemo(() => {
    const id = selected();
    if (!id) return null;

    return AccordionItem.findPathTo(id, props.items);
  });

  const Item = (item: AccordionItem) => {
    createEffect(() => {
      if (pathToSelected()?.includes(item.id)) setExpansion(item.id, true);
      else setExpansion(item.id, false);
    });

    const isExpanded = createMemo(() => expanded().get(item.id) || props.expanded);

    return (
      <li
        class={cx('flex flex-col gap-1 group peer')}
        onClick={prevented(() => {
          if (!item.children) return select(item.id);

          if (isExpanded() && AccordionItem.within(item.children, selected())) select(undefined);
          toggleExpansion(item.id);
        })}
      >
        <div
          class={cx(
            'cursor-pointer transition-all flex justify-between p-1 rounded-sm select-none',
            selected() === item.id
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
              class={isExpanded() ? 'rotate-0' : 'rotate-90'}
              size="sm"
              variant="text"
              icon="CgChevronDown"
              onClick={prevented(() => toggleExpansion(item.id))}
            />
          </Show>
        </div>
        <ul
          class={cx(
            'ml-4 grid transition-[grid-template-rows] duration-100',
            isExpanded() ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
          )}
        >
          <div class="overflow-hidden">
            <For each={item.children} children={Item} />
          </div>
        </ul>
      </li>
    );
  };

  return (
    <ul class={cx('flex flex-col h-full overflow-auto px-2', props.class)}>
      <For each={props.items} children={Item} />
    </ul>
  );
};
