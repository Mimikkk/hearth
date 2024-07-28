import { NodeMaterial, vec4 } from '../nodes/Nodes.js';
import { QuadMesh } from '../objects/QuadMesh.js';
import { Forge } from '@modules/renderer/engine/renderers/Forge.js';

export class Postprocess {
  constructor(
    public renderer: Forge,
    public outputNode = vec4(0, 0, 1, 1),
  ) {}

  render() {
    (mesh.material as NodeMaterial).fragmentNode = this.outputNode;

    mesh.render(this.renderer);
  }
}

const mesh = new QuadMesh(new NodeMaterial());

export default Postprocess;
