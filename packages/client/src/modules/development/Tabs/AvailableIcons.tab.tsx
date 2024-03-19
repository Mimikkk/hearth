import { Icon, type IconName, IconRegistry } from '@components/buttons/Icon/Icon.js';
import { createEffect, createSignal, on } from 'solid-js';
import { TextField } from '@components/forms/TextField/TextField.js';
import s from './AvailableIcons.tab.module.scss';
import { Devtools } from '@modules/development/devtools.js';
import { createQueryable } from '@logic/createQueryable.js';
import { Grid } from '@components/control/Grid/Grid.js';

const names = Object.keys(IconRegistry) as IconName[];

export const AvailableIconsTab = () => {
  const [queried, query, setQuery] = createQueryable(names);
  const [tooltip, setTooltip] = createSignal<string | null>(null);

  let ref!: HTMLInputElement;
  createEffect(
    on(
      () => [ref, Devtools.active()],
      ([ref, active]) => {
        if (!ref || !active) return;
        setQuery('');
        ref.focus();
      },
    ),
  );

  return (
    <div class={s.tab}>
      <TextField id="icon-query" ref={ref} class={s.search} label="search..." value={query()} onChange={setQuery} />
      <div class="h-6">{tooltip()}</div>
      <div class="border rounded-sm p-2 pr-0.5 pb-0.5" onPointerLeave={() => setTooltip('')}>
        <Grid
          itemprops={name => ({
            onClick: () => navigator.clipboard.writeText(name),
            onPointerEnter: () => setTooltip(name),
          })}
          itemclass={s.container}
          items={queried()}
          rows={6}
          columns={8}
          sizes={{ width: 64, height: 64 }}
          gap={4}
        >
          {name => <Icon class="w-full" name={name} onPointerEnter={() => setTooltip(name)} />}
        </Grid>
      </div>
    </div>
  );
};
