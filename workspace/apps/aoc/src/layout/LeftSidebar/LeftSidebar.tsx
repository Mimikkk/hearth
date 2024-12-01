interface LeftSidebarProps {
  class?: string;
}

export const LeftSidebar = (props: LeftSidebarProps) => {
  return <div class={props.class}>Left Sidebar</div>;
};
