const CanIUseLink = 'https://caniuse.com/webgpu';

export namespace WebGPUManager {
  let _adapter: GPUAdapter | undefined | null;

  export async function isAvailable(): Promise<boolean> {
    if (_adapter) return true;

    _adapter = await navigator.gpu?.requestAdapter();

    return !!_adapter;
  }

  export async function readAdapter(): Promise<GPUAdapter> {
    if (await isAvailable()) return _adapter!;
    throw Error(`\nWebGPU is not available. \nAvailability: '${CanIUseLink}'`);
  }
}
