import { NodeMaterial, vec4 } from '../nodes/Nodes.js';
import { QuadMesh } from '../objects/QuadMesh.js';
import { Renderer } from '@modules/renderer/engine/renderers/Renderer.js';

export class Postprocess {
  constructor(
    public renderer: Renderer,
    public outputNode = vec4(0, 0, 1, 1),
  ) {}

  render() {
    (mesh.material as NodeMaterial).fragmentNode = this.outputNode;

    mesh.render(this.renderer);
  }
}

const mesh = new QuadMesh(new NodeMaterial());

export default Postprocess;
