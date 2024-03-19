import { useContent } from '@modules/managment/useContent.js';
import { Show } from 'solid-js';

const Backdrop = () => {
  // write a component which asks to select an example from the sidebar

  return <div class="w-full h-full bg-gray-300 rounded-sm center">Select an example from the sidebar</div>;
};

export const Canvas = () => {
  const { selected } = useContent();

  return (
    <div class="w-full h-full rounded-sm border border-primary-3">
      <Show when={selected()} fallback={<Backdrop />}>
        <object
          class="w-full h-full rounded-sm"
          type="text/html"
          data={`src/modules/renderer/examples/${selected()}.html`}
        />
      </Show>
    </div>
  );
};
