import cx from "clsx";
import { type JSX, mergeProps, Show, splitProps } from "solid-js";
import s from "./ButtonIcon.module.css";
import type { IconName } from "./Icon.tsx";
import { Icon } from "./Icon.tsx";

export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

export interface ButtonIconProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize;
  icon: IconName;
  iconclass?: string;
  variant?: "text" | "contained";
  active?: boolean;
  cross?: boolean;
}

const keys = [
  "iconclass",
  "icon",
  "active",
  "size",
  "class",
  "children",
  "variant",
  "active",
  "cross",
] satisfies (keyof ButtonIconProps)[];
const initial = { variant: "contained", size: "md" } satisfies Partial<ButtonIconProps>;
export const ButtonIcon = (props: ButtonIconProps) => {
  const [icon, $] = splitProps(mergeProps(initial, props), keys);

  return (
    <button
      data-active={icon.active ? "" : undefined}
      class={cx(s.button, "relative", s[`size-${icon.size}`], s[`variant-${icon.variant}`], icon.class)}
      {...$}
    >
      <Show when={icon.cross}>
        <Icon
          size={icon.size}
          class="stroke stroke-accent-8 w-max -rotate-45 absolute pointer-events-none"
          name="CgBorderStyleSolid"
        />
      </Show>
      <Icon name={icon.icon} class={icon.iconclass} />
      {icon.children}
    </button>
  );
};
