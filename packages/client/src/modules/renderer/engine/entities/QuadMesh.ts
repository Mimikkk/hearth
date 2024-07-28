import { Attribute, Geometry, Material, Mesh, OrthographicCamera } from '../engine.js';
import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';

const _camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

export class QuadGeometry extends Geometry {
  constructor(flipY = false) {
    super();

    const uv = flipY === false ? [0, -1, 0, 1, 2, 1] : [0, 2, 0, 0, 2, 0];

    this.setAttribute('position', new Attribute(new Float32Array([-1, 3, 0, -1, -1, 0, 3, -1, 0]), 3));
    this.setAttribute('uv', new Attribute(new Float32Array(uv), 2));
  }
}

const _geometry = new QuadGeometry();

export class QuadMesh extends Mesh {
  camera: OrthographicCamera;

  constructor(material: Material | null) {
    super(_geometry, material!);

    this.camera = _camera;
  }

  render(hearth: Hearth): void {
    hearth.render(this, _camera);
  }
}
