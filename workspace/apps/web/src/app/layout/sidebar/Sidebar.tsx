import cx from "clsx";

export const Sidebar = (props: { class?: string }) => (
  <div class={cx("bg-primary-1 p-4 h-full", props.class)}>Sidebar</div>
);
