import { Icon, type IconName, IconRegistry } from '@components/buttons/Icon/Icon.js';
import { createEffect, createSignal, For } from 'solid-js';
import { TextField } from '@components/forms/TextField/TextField.js';
import s from './AvailableIcons.tab.module.scss';
import { Devtools } from '@modules/development/devtools.js';
import { createQueryable } from '@logic/createQueryable.opt.js';

const names = Object.keys(IconRegistry)
  .slice(0, 10)
  .map(name => ({ outer: { name }, inner: name })) as {
  outer: { name: IconName };
  inner: IconName;
}[];
const namess = Object.keys(IconRegistry).slice(0, 10) as IconName[];

export const AvailableIconsTab = () => {
  const [queried, query, setQuery] = createQueryable(names, {
    threshold: 0.4,
    isCaseSensitive: true,
    minMatchCharLength: 2,
    keys: ['outer.name', 'inner', { weight: 5, name: 'inner' }],
  });
  const [tooltip, setTooltip] = createSignal<string | null>(null);

  let ref: HTMLInputElement | undefined = undefined;
  createEffect(() => {
    if (!ref || !Devtools.active()) return;
    setQuery('');
    ref.focus();
  });

  return (
    <div class={s.tab}>
      <TextField id="query" ref={ref} class={s.search} label="search..." value={query()} onChange={setQuery} />
      <div class="h-6">{tooltip()}</div>
      <div class="grid grid-cols-8 w-1/2 gap-x-1 gap-y-2 p-2 border" onPointerLeave={() => setTooltip('')}>
        <For each={queried()}>
          {icon => (
            <div class="center w-12 h-12 border rounded-sm bg-primary-2" onPointerEnter={() => setTooltip(icon)}>
              <Icon class="w-full" name={icon.inner} />
            </div>
          )}
        </For>
      </div>
    </div>
  );
};
