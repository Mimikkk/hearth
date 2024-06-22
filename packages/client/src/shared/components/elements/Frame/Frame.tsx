import { createMemo } from 'solid-js';
import cx from 'clsx';
import { dragPointerIds } from '@logic/createDrag.js';

export interface FrameProps {
  src: string;
  class?: string;
}

export const Frame = (props: FrameProps) => {
  const styleClass = createMemo(() => cx(props.class, dragPointerIds().size > 0 && 'pointer-events-none'));

  return <iframe {...props} class={styleClass()} />;
};
