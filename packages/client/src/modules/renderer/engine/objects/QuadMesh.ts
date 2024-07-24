import { BufferAttribute, Geometry, Material, Mesh, OrthographicCamera } from '../engine.js';
import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';

// Helper for passes that need to fill the viewport with a single quad.

const _camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

// https://github.com/mrdoob/engine.js/pull/21358

export class QuadGeometry extends Geometry {
  constructor(flipY = false) {
    super();

    const uv = flipY === false ? [0, -1, 0, 1, 2, 1] : [0, 2, 0, 0, 2, 0];

    this.setAttribute('position', new BufferAttribute(new Float32Array([-1, 3, 0, -1, -1, 0, 3, -1, 0]), 3));
    this.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2));
  }
}

const _geometry = new QuadGeometry();

export class QuadMesh extends Mesh {
  camera: OrthographicCamera;

  constructor(material: Material | null) {
    super(_geometry, material!);

    this.camera = _camera;
  }

  renderAsync(renderer: Renderer): Promise<void> {
    return renderer.render(this, _camera);
  }

  render(renderer: Renderer): void {
    renderer.render(this, _camera);
  }
}
