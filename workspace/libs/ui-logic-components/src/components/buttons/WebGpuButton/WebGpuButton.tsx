import { Button } from "@mimi/ui-components";

const WebGpu = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 25" class="w-8 h-6">
    <path d="m26.11 12.313-2.508-4.344h5.023z" style="fill:#0086e8" />
    <path d="m26.11 3.625-2.508 4.344h5.023z" style="fill:#0093ff" />
    <path d="m21.094 21-5.016-8.687H26.11z" style="fill:#0076cc" />
    <path d="m21.094 3.625-5.016 8.688H26.11z" style="fill:#0066b0" />
    <path d="M11.063 21 1.031 3.625h20.063z" style="fill:#005a9c" />
  </svg>
);

export const WebGpuButton = () => (
  <Button href="https://www.w3.org/TR/webgpu" variant="text" title="WebGPU specification">
    <WebGpu />
  </Button>
);
