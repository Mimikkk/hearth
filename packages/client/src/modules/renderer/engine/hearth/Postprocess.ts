import { NodeMaterial, vec4 } from '../nodes/Nodes.js';
import { QuadMesh } from '@modules/renderer/engine/entities/QuadMesh.js';
import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';

export class Postprocess {
  constructor(
    public renderer: Hearth,
    public outputNode = vec4(0, 0, 1, 1),
  ) {}

  render() {
    (mesh.material as NodeMaterial).fragmentNode = this.outputNode;

    mesh.render(this.renderer);
  }
}

const mesh = new QuadMesh(new NodeMaterial());

export default Postprocess;
