import { useContent } from '@modules/managment/useContent.js';
import { createEffect, createMemo, Show } from 'solid-js';
import { Icon } from '@components/buttons/Icon/Icon.js';
import { ExampleNs } from '@modules/managment/exampleNs.js';
import { Frame } from '@components/elements/Frame/Frame.js';
import { createResizer } from '@logic/createResizer.js';
import { DragCorner } from '@components/control/DragCorner/DragCorner.js';
import cx from 'clsx';
import { CodeView } from '@modules/interface/Content/CodeView.js';

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

  const { showCode } = useContent();

  const srcHtml = createMemo(() => `src/modules/renderer/examples/${selectedExample()}.html`);
  const srcTs = createMemo(() => `src/modules/renderer/examples/${selectedExample()}.ts`);

  createEffect(() => {
    if (!showCode()) drag.reset();
  });

  const drag = createResizer({ vertical: false });

  return (
    <div class="w-full h-full rounded-sm border border-primary-3 flex gap-2">
      <div ref={drag.target.ref} class={cx('relative flex-shrink-0', showCode() ? 'w-[50%] max-w-[80%]' : 'w-full')}>
        <Show when={isWebGpuAvailable} fallback={<Unavailable />}>
          <Show when={selectedExample()} fallback={<Backdrop />}>
            <Frame class="w-full h-full rounded-sm" src={srcHtml()} />
          </Show>
        </Show>
        <DragCorner onDoubleClick={drag.reset} onDrag={drag.start} type="right" />
      </div>
      <Show when={showCode()}>
        <CodeView src={srcTs()} />
      </Show>
    </div>
  );
};
