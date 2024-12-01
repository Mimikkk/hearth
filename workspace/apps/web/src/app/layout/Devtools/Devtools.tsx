import { DevtoolsButton } from "../Devtools/DevtoolsButton.tsx";

interface DevtoolsProps {
  class?: string;
}

export const Devtools = (props: DevtoolsProps) => <DevtoolsButton class={props.class} />;
