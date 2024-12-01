import { ThemeButton } from "@mimi/ui-logic-components";

interface FooterProps {
  class?: string;
}

export const Footer = (props: FooterProps) => {
  return (
    <div class={props.class}>
      <ThemeButton />
    </div>
  );
};
