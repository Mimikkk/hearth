import { vec4, NodeMaterial } from '../../nodes/Nodes.js';
import { QuadMesh } from '../../objects/QuadMesh.js';
import { Renderer } from '@modules/renderer/engine/renderers/common/Renderer.js';

const mesh = new QuadMesh(new NodeMaterial());

class PostProcessing {
  renderer: Renderer;
  outputNode: any;

  constructor(renderer: Renderer, outputNode = vec4(0, 0, 1, 1)) {
    this.renderer = renderer;
    this.outputNode = outputNode;
  }

  render() {
    (mesh.material as NodeMaterial).fragmentNode = this.outputNode;

    mesh.render(this.renderer);
  }

  renderAsync() {
    (mesh.material as NodeMaterial).fragmentNode = this.outputNode;

    return mesh.renderAsync(this.renderer);
  }
}

export default PostProcessing;
