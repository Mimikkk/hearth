import { Renderer } from '../../../threejs/renderers/common/Renderer.js';
import { WebGPUBackend } from './WebGPUBackend.js';

export class WebGPURenderer extends Renderer {
  constructor(parameters = {}) {
    const backend = new WebGPUBackend(parameters);

    super(backend, parameters);

    this.isWebGPURenderer = true;
  }
}
