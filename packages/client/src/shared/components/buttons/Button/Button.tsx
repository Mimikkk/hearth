import { type JSX, mergeProps, splitProps } from "solid-js";
import cx from "clsx";
import s from "./Button.module.scss";

export interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  square?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  variant?: "text" | "contained";
}

const keys = ["square", "size", "variant", "class"] satisfies (keyof ButtonProps)[];
const initial = { type: "button", variant: "contained" } satisfies Partial<ButtonProps>;
export const Button = (props: ButtonProps) => {
  const [button, $] = splitProps(mergeProps(initial, props), keys);

  return (
    <button
      class={cx(
        s.button,
        s[`size-${button.size}`],
        s[`variant-${button.variant}`],
        button.square && "aspect-square",
        button.class,
      )}
      {...$}
    />
  );
};
