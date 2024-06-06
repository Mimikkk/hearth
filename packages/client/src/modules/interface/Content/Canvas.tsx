import { useContent } from '@modules/managment/useContent.js';
import { Show } from 'solid-js';
import { Icon } from '@components/buttons/Icon/Icon.js';
import { ExampleNs } from '@modules/managment/exampleNs.js';

const Backdrop = () => (
  <div class="w-full h-full center bg-gray-300 rounded-sm">
    <label for={ExampleNs.Search.QueryId} class="center gap-2 hover:text-primary-7 transition">
      <Icon name="BsChevronDoubleLeft" />
      Select an example from the sidebar on the left
    </label>
  </div>
);

export const Canvas = () => {
  const { selectedExample } = useContent();

  return (
    <div class="w-full h-full rounded-sm border border-primary-3">
      <Show when={selectedExample()} fallback={<Backdrop />}>
        <object
          class="w-full h-full rounded-sm"
          type="text/html"
          data={`src/modules/renderer/examples/${selectedExample()}.html`}
        />
      </Show>
    </div>
  );
};
