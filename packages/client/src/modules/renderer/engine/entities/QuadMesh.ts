import type { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { OrthographicCamera } from '@modules/renderer/engine/entities/cameras/OrthographicCamera.js';
import { Geometry } from '@modules/renderer/engine/core/Geometry.js';
import { Attribute } from '@modules/renderer/engine/core/Attribute.js';
import { Mesh } from '@modules/renderer/engine/entities/Mesh.js';
import type { Material } from '@modules/renderer/engine/entities/materials/Material.js';
import { Buffer } from '@modules/renderer/engine/core/Buffer.js';

export class QuadGeometry extends Geometry {
  static #attributes = {
    position: Attribute.use(Buffer.f32([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3)),
    uv: Attribute.use(Buffer.f32([0, -1, 0, 1, 2, 1], 2)),
  };

  constructor() {
    super();

    this.withAttributes(QuadGeometry.#attributes);
  }
}

export class QuadMesh extends Mesh {
  static #geometry = new QuadGeometry();
  static #camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  camera: OrthographicCamera;

  constructor(material?: Material) {
    super(QuadMesh.#geometry, material);
    this.camera = QuadMesh.#camera;
  }

  async render(hearth: Hearth): Promise<void> {
    await hearth.render(this, QuadMesh.#camera);
  }
}
