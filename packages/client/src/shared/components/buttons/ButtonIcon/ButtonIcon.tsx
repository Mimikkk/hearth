import type { IconName } from "@components/buttons/Icon/Icon.js";
import { Icon } from "@components/buttons/Icon/Icon.js";
import { type JSX, mergeProps, splitProps } from "solid-js";
import cx from "clsx";
import s from "./ButtonIcon.module.scss";

export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

export interface ButtonIconProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize;
  icon: IconName;
  iconclass?: string;
  variant?: "text" | "contained";
  active?: boolean;
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
] satisfies (keyof ButtonIconProps)[];
const initial = { variant: "contained", size: "md" } satisfies Partial<ButtonIconProps>;
export const ButtonIcon = (props: ButtonIconProps) => {
  const [icon, $] = splitProps(mergeProps(initial, props), keys);

  return (
    <button
      data-active={icon.active ? "" : undefined}
      class={cx(s.button, s[`size-${icon.size}`], s[`variant-${icon.variant}`], icon.class)}
      {...$}
    >
      <Icon name={icon.icon} class={icon.iconclass} />
      {icon.children}
    </button>
  );
};
