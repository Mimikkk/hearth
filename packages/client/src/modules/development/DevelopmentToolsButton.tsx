import { ButtonIcon } from '@components/buttons/ButtonIcon/ButtonIcon.js';
import { Devtools } from '@modules/development/devtools.js';

interface DevelopmentToolsButtonProps {
  class?: string;
}

export const DevelopmentToolsButton = (props: DevelopmentToolsButtonProps) => (
  <div class={props.class} title={Devtools.active() ? 'Close development tools' : 'Open development tools'}>
    <ButtonIcon cross={Devtools.active()} icon="CgToolbox" variant="text" onClick={Devtools.toggle} />
  </div>
);
