import { ButtonIcon } from "@mimi/ui-components";
import { useDevTools } from "./useDevtools.tsx";

interface DevelopmentToolsButtonProps {
  class?: string;
}

export const DevelopmentToolsButton = (props: DevelopmentToolsButtonProps) => {
  const { active, toggle } = useDevTools();

  return (
    <div class={props.class} title={active() ? "Close development tools" : "Open development tools"}>
      <ButtonIcon cross={active()} icon="CgToolbox" variant="text" onClick={toggle} />
    </div>
  );
};
