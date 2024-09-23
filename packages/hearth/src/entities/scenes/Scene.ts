import { Entity } from '../../core/Entity.js';
import { Euler } from '../../math/Euler.js';
import type { Fog } from './Fog.js';
import type { Material } from '../materials/Material.js';
import type { Color } from '../../math/Color.js';
import type { Texture } from '../textures/Texture.js';
import type { CubeTexture } from '../textures/CubeTexture.js';
import { EnvironmentNode } from '../../nodes/lighting/EnvironmentNode.js';
import { FogNode } from '../../nodes/fog/FogNode.js';
import { Node } from '../../nodes/core/Node.js';
import { Hearth } from '../../hearth/Hearth.js';
import { ICamera } from '../cameras/Camera.js';

export class Scene extends Entity {
  declare isScene: true;
  declare environmentNode: EnvironmentNode | null;
  declare backgroundNode: Node | null;
  declare fogNode: FogNode | null;
  fog: Fog | null;
  background: Color | Texture | CubeTexture | null;
  environment: any;
  backgroundBlurriness: number;
  backgroundIntensity: number;
  backgroundRotation: Euler;
  environmentRotation: Euler;
  overrideMaterial: Material | null;

  constructor() {
    super();

    this.background = null;
    this.environment = null;
    this.fog = null;
    this.backgroundBlurriness = 0;
    this.backgroundIntensity = 1;
    this.backgroundRotation = new Euler();
    this.environmentRotation = new Euler();
    this.overrideMaterial = null;
  }

  static is(scene: any): scene is Scene {
    return scene?.isScene === true;
  }

  static of(...entities: Entity[]): Scene {
    const scene = new Scene();
    scene.add(...entities);
    return scene;
  }

  attach(hearth: Hearth, camera: ICamera): void {
    hearth.animation.before.push(() => hearth.render(this, camera));
  }
}

Scene.prototype.isScene = true;
