import { BufferGeometry, Float32BufferAttribute, Material, Mesh, OrthographicCamera } from '../engine.js';
import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';

export class QuadGeometry extends BufferGeometry {
  constructor(flipY: boolean = false) {
    super();

    const uv = flipY ? [0, 2, 0, 0, 2, 0] : [0, -1, 0, 1, 2, 1];

    this.attributes.position = new Float32BufferAttribute([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3);
    this.attributes.uv = new Float32BufferAttribute(uv, 2);
  }
}

const _camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
const _geometry = new QuadGeometry();

export class QuadMesh extends Mesh {
  declare isQuadMesh: true;
  camera: OrthographicCamera;

  constructor(material: Material | null) {
    super(_geometry, material!);

    this.isQuadMesh = true;
    this.camera = _camera;
  }

  static is(object: any): object is QuadMesh {
    return object?.isQuadMesh === true;
  }

  render(renderer: Renderer): void {
    renderer.render(this, _camera);
  }
}
