import { Renderer, RendererParameters } from '../common/Renderer.js';
import { WebGPUBackendParameters } from '@modules/renderer/threejs/renderers/webgpu/WebGPUBackend.js';

export interface WebGPURendererParameters extends RendererParameters, WebGPUBackendParameters {}

export class WebGPURenderer extends Renderer {
  constructor(parameters?: WebGPURendererParameters) {
    super(parameters);
  }
}
