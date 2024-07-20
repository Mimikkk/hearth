import { useContent } from '@modules/managment/useContent.js';
import { Show } from 'solid-js';
import { Icon } from '@components/buttons/Icon/Icon.js';
import { ExampleNs } from '@modules/managment/exampleNs.js';
import { Frame } from '@components/elements/Frame/Frame.js';

const Backdrop = () => (
  <div class="w-full h-full center bg-gray-300 rounded-sm">
    <label for={ExampleNs.Search.QueryId} class="center gap-2 hover:text-primary-7 transition">
      <Icon name="BsChevronDoubleLeft" />
      Select an example from the sidebar on the left
    </label>
  </div>
);

const Unavailable = () => (
  <div class="w-full h-full center flex flex-col">
    <span class="text-primary-dark flex gap-1 center">
      <Icon name="BiSolidCog" size="lg" class="h-6 w-6" />
      <span class="text-primary-5">WebGPU</span> is unavailable under this browser
    </span>
    <span class="text-primary-4">
      Availability at:{' '}
      <a
        class="active:text-primary-5 hover:text-primary-4 text-primary-5 visited:text-accent-5 transition-all"
        href="https://caniuse.com/webgpu"
      >
        https://caniuse.com/webgpu
      </a>
    </span>
    <Icon name="RiUserFacesEmotionSadLine" size="3xl" class="mt-4 !h-36 !w-36" />
  </div>
);

export const Canvas = () => {
  const { selectedExample } = useContent();

  const isWebGpuAvailable = 'gpu' in navigator;

  return (
    <div class="w-full h-full rounded-sm border border-primary-3">
      <Show when={isWebGpuAvailable} fallback={<Unavailable />}>
        <Show when={selectedExample()} fallback={<Backdrop />}>
          <Frame class="w-full h-full rounded-sm" src={`src/modules/renderer/examples/${selectedExample()}.html`} />
        </Show>
      </Show>
    </div>
  );
};
