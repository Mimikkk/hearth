import type { IconName } from '@components/buttons/Icon/Icon.js';
import { Icon } from '@components/buttons/Icon/Icon.js';
import { createMemo, type JSX, mergeProps, on, splitProps } from 'solid-js';
import cx from 'clsx';
import s from './ButtonIcon.module.scss';
import { Dynamic } from 'solid-js/web';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

export interface ButtonIconProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize;
  icon: IconName;
  iconclass?: string;
  variant?: 'text' | 'contained';
  active?: boolean;
  crossed?: boolean;
}

const keys = [
  'iconclass',
  'icon',
  'active',
  'size',
  'class',
  'children',
  'variant',
  'active',
  'crossed',
] satisfies (keyof ButtonIconProps)[];
const initial = { variant: 'contained', size: 'md' } satisfies Partial<ButtonIconProps>;
export const ButtonIcon = (props: ButtonIconProps) => {
  const [icon, $] = splitProps(mergeProps(initial, props), keys);

  const Cross = createMemo(
    on(
      () => icon.crossed,
      () => {
        if (icon.crossed)
          return (
            <Icon
              class="stroke stroke-accent-8 w-max -rotate-45 top-1 left-1 absolute pointer-events-none"
              name="CgBorderStyleSolid"
            />
          );

        return null;
      },
    ),
  );

  return (
    <button
      accessKey={icon.icon}
      data-active={icon.active ? '' : undefined}
      class={cx(s.button, 'relative', s[`size-${icon.size}`], s[`variant-${icon.variant}`], icon.class)}
      {...$}
    >
      <Dynamic component={Cross} />
      <Icon name={icon.icon} class={icon.iconclass} />
      {icon.children}
    </button>
  );
};
