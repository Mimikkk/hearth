interface RightSidebarProps {
  class?: string;
}

export const RightSidebar = (props: RightSidebarProps) => {
  return <div class={props.class}>Right Sidebar</div>;
};
