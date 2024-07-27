import { Node } from '../core/Node.js';
import { fixedNode } from '../shadernode/ShaderNodes.js';
import { reference } from './ReferenceNode.js';

class SceneNode extends Node {
  static type = 'SceneNode';

  constructor(scope = SceneNode.BACKGROUND_BLURRINESS, scene = null) {
    super();

    this.scope = scope;
    this.scene = scene;
  }

  setup(builder) {
    const scope = this.scope;
    const scene = this.scene !== null ? this.scene : builder.scene;

    let output;

    if (scope === SceneNode.BACKGROUND_BLURRINESS) {
      output = reference('backgroundBlurriness', 'f32', scene);
    } else if (scope === SceneNode.BACKGROUND_INTENSITY) {
      output = reference('backgroundIntensity', 'f32', scene);
    } else {
      console.error('engine.SceneNode: Unknown scope:', scope);
    }

    return output;
  }
}

SceneNode.BACKGROUND_BLURRINESS = 'backgroundBlurriness';
SceneNode.BACKGROUND_INTENSITY = 'backgroundIntensity';

export default SceneNode;

export const backgroundBlurriness = fixedNode(SceneNode, SceneNode.BACKGROUND_BLURRINESS);
export const backgroundIntensity = fixedNode(SceneNode, SceneNode.BACKGROUND_INTENSITY);
