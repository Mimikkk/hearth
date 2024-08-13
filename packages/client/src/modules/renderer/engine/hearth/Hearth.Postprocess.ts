import { QuadMesh } from '@modules/renderer/engine/entities/QuadMesh.js';
import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { NodeMaterial } from '@modules/renderer/engine/nodes/materials/NodeMaterial.js';
import { Node } from '@modules/renderer/engine/nodes/core/Node.js';

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
