import { createEffectListener } from '@logic/createListener.js';
import { createStorageSignal } from '@logic/Storage/createStorageSignal.js';

export namespace Devtools {
  export const [active, set] = createStorageSignal('devtool-expanded', false);

  export const toggle = () => set(!active());

  export const createKeyboardShortcut = () =>
    createEffectListener('keydown', ({ altKey, ctrlKey, key }) => ctrlKey && altKey && key === 'd' && toggle());
}
