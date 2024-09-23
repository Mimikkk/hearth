import { Node } from '../core/Node.js';
import { ref } from './ReferenceNode.js';
import { Scene } from '../../entities/scenes/Scene.js';
import { NodeBuilder } from '../../nodes/builder/NodeBuilder.js';

export class SceneNode extends Node {
  constructor(
    public scope: NodeVariant,
    public scene?: Scene,
  ) {
    super();
  }

  setup(builder: NodeBuilder): Node {
    const scene = this.scene ?? builder.scene;

    switch (this.scope) {
      case NodeVariant.BackgroundBlurriness:
        return ref('backgroundBlurriness', 'f32', scene);
      case NodeVariant.BackgroundIntensity:
        return ref('backgroundIntensity', 'f32', scene);
    }
  }
}

enum NodeVariant {
  BackgroundBlurriness = 'backgroundBlurriness',
  BackgroundIntensity = 'backgroundIntensity',
}

export const backgroundBlurriness = new SceneNode(NodeVariant.BackgroundBlurriness);
export const backgroundIntensity = new SceneNode(NodeVariant.BackgroundIntensity);
