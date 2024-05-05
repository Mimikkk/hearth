import { IconName } from '@components/buttons/Icon/Icon.js';
import { createEffect, createSignal, For, Show } from 'solid-js';
import { createToggle } from '@logic/createToggle.js';
import cx from 'clsx';
import { prevented } from '@utils/prevented.js';
import { ButtonIcon } from '@components/buttons/ButtonIcon/ButtonIcon.js';

export interface AccordionItem {
  icon?: IconName;
  title: string;
  id: string;
  children?: AccordionItem[];
}

const within = (items: AccordionItem[], id?: string): boolean =>
  !id || items.some(item => id === item.id || (item.children && within(item.children, id)));

export interface AccordionProps {
  onSelect?: (id: string | null) => void;
  items: AccordionItem[];
  expanded?: boolean;
  selected?: string;
  class?: string;
}

export const Accordion = (props: AccordionProps) => {
  const [selected, select] = createSignal<string | undefined>(props.selected);

  createEffect(() => {
    props.onSelect?.(selected() ?? '');
  });

  const Item = (item: AccordionItem) => {
    const [expanded, , toggleExpand] = createToggle(props.expanded);

    return (
      <li
        class={cx('flex flex-col gap-1 group peer')}
        onClick={prevented(() => {
          if (!item.children) return select(item.id);

          if (expanded() && within(item.children, selected())) select(undefined);
          toggleExpand();
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
              class={expanded() ? 'rotate-0' : 'rotate-90'}
              size="sm"
              variant="text"
              icon="CgChevronDown"
              onClick={prevented(toggleExpand)}
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
      <For each={props.items} children={Item} />
    </ul>
  );
};
