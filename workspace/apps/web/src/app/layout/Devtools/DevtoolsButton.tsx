import { ButtonIcon } from "@mimi/ui-components";
import cx from "clsx";
import { useDevTools } from "./useDevtools.tsx";

interface DevtoolsButtonProps {
  class?: string;
}

export const DevtoolsButton = (props: DevtoolsButtonProps) => {
  const { active, toggle } = useDevTools();

  return (
    <div
      class={cx(
        props.class,
        "px-2 py-1 flex justify-center items-center bg-primary-dark border-t border-l border-primary-white hover:border-golden-3 has-[button[data-active]]:border-golden-3 transition-all",
      )}
      title={active() ? "Close development tools" : "Open development tools"}
    >
      <ButtonIcon
        active={active()}
        cross={active()}
        icon="CgToolbox"
        variant="text"
        onClick={toggle}
      />
    </div>
  );
};
