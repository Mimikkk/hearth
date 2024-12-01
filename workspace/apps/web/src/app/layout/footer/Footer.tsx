interface FooterProps {
  class?: string;
}

export const Footer = (props: FooterProps) => {
  return <div class={props.class}>Footer Content</div>;
};
