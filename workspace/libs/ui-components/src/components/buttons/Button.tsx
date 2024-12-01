import cx from "clsx";
import { createMemo, type JSX, mergeProps, splitProps } from "solid-js";
import { Dynamic } from "solid-js/web";
import s from "./Button.module.css";

interface ButtonTagProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: never;
}
interface AnchorTagProps extends JSX.AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: string;
}
export type ButtonProps = {
  square?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  variant?: "text" | "contained";
  class?: string;
} & (ButtonTagProps | AnchorTagProps);

const keys = ["square", "size", "variant", "class", "href"] satisfies (keyof ButtonProps)[];
const initial = { type: "button", variant: "contained" } satisfies Partial<ButtonProps>;
export const Button = (props: ButtonProps) => {
  const [local, $] = splitProps(mergeProps(initial, props), keys);
  const tag = createMemo(() => (local.href ? "a" : "button"));

  return (
    <Dynamic
      component={tag()}
      href={local.href}
      target={local.href?.startsWith("http") ? "_blank" : undefined}
      class={cx(
        s.button,
        s[`size-${local.size}`],
        s[`variant-${local.variant}`],
        local.square && "aspect-square",
        local.class,
      )}
      {...$}
    />
  );
};
