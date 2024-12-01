import { ButtonIcon } from "@mimi/ui-components";
import { useDevTools } from "./useDevtools.tsx";

interface DevtoolsButtonProps {
  class?: string;
}

export const DevtoolsButton = (props: DevtoolsButtonProps) => {
  const { active, toggle } = useDevTools();

  return (
    <div class={props.class} title={active() ? "Close development tools" : "Open development tools"}>
      <ButtonIcon cross={active()} icon="CgToolbox" variant="text" onClick={toggle} />
    </div>
  );
};
