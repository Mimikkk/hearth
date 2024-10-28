import cx from "clsx";

export const Content = (props: { class?: string }) => (
  <div class={cx("bg-primary-1 p-4 h-full", props.class)}>Content</div>
);
