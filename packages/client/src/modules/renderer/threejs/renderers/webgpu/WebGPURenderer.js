import { WebGPUManager } from '@modules/renderer/threejs/capabilities/WebGPUManager.ts';

import { Renderer } from '../../../threejs/renderers/common/Renderer.js';
import WebGLBackend from '../webgl/WebGLBackend.js';
import WebGPUBackend from './WebGPUBackend.js';

export class WebGPURenderer extends Renderer {
  constructor(parameters = {}) {
    let BackendClass;

    if (parameters.forceWebGL) {
      BackendClass = WebGLBackend;
    } else if (WebGPUManager.isAvailable()) {
      BackendClass = WebGPUBackend;
    } else {
      BackendClass = WebGLBackend;

      console.warn('THREE.WebGPURenderer: WebGPU is not available, running under WebGL2 backend.');
    }

    const backend = new BackendClass(parameters);

    //super( new Proxy( backend, debugHandler ) );
    super(backend, parameters);

    this.isWebGPURenderer = true;
  }
}
