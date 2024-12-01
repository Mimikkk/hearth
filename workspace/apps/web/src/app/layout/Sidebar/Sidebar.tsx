interface SidebarProps {
  class?: string;
}

export const Sidebar = (props: SidebarProps) => {
  return <div class={props.class}>Left Sidebar</div>;
};
