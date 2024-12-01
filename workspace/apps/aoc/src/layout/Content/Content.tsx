interface ContentProps {
  class?: string;
}

export const Content = (props: ContentProps) => {
  return <section class={props.class}>Main Content</section>;
};
