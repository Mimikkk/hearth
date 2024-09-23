import { QuadMesh } from '../entities/QuadMesh.js';
import { Hearth } from './Hearth.js';
import { NodeMaterial } from '../nodes/materials/NodeMaterial.js';
import { Node } from '../nodes/core/Node.js';

export class HearthPostprocess {
  constructor(
    public hearth: Hearth,
    public outputNode: Node,
  ) {}

  async render(): Promise<void> {
    (mesh.material as NodeMaterial).fragmentNode = this.outputNode;

    await mesh.render(this.hearth);
  }
}

const mesh = new QuadMesh(new NodeMaterial());
