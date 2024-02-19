interface ContentProps {
  class?: string;
}

export const Content = (props: ContentProps) => {
  return <div class={props.class}>Content</div>;
};
