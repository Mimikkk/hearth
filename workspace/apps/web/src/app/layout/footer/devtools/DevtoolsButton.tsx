import { ButtonIcon } from "../../../components/buttons//ButtonIcon.tsx";
import { useDevTools } from "./useDevtools.tsx";

interface DevelopmentToolsButtonProps {
  class?: string;
}

export const DevelopmentToolsButton = (props: DevelopmentToolsButtonProps) => {
  const Devtools = useDevTools();

  return (
    <div class={props.class} title={Devtools.active() ? "Close development tools" : "Open development tools"}>
      <ButtonIcon cross={Devtools.active()} icon="CgToolbox" variant="text" onClick={Devtools.toggle} />
    </div>
  );
};
