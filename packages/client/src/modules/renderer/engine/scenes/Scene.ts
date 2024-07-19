import { Object3D } from '../core/Object3D.js';
import { Euler } from '../math/Euler.js';
import type { Fog } from './Fog.js';
import type { Material } from '../materials/Material.js';
import type { Color } from '../math/Color.js';
import type { Texture } from '../textures/Texture.js';
import type { CubeTexture } from '../textures/CubeTexture.js';
import { EnvironmentNode } from '@modules/renderer/engine/nodes/Nodes.js';
import FogNode from '@modules/renderer/engine/nodes/fog/FogNode.js';

export class Scene extends Object3D {
  declare isScene: true;
  declare environmentNode: EnvironmentNode | null;
  declare backgroundNode: Node | null;
  declare fogNode: FogNode | null;
  type: string | 'Scene';
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

    this.type = 'Scene';

    this.background = null;
    this.environment = null;
    this.fog = null;
    this.backgroundBlurriness = 0;
    this.backgroundIntensity = 1;
    this.backgroundRotation = Euler.empty();
    this.environmentRotation = Euler.empty();
    this.overrideMaterial = null;
  }

  static is(value: any): value is Scene {
    return value && value.isScene;
  }

  copy(source: this, recursive?: boolean): this {
    super.copy(source, recursive);

    if (source.background) this.background = source.background.clone();
    if (source.environment) this.environment = source.environment.clone();
    if (source.fog) this.fog = source.fog.clone();

    this.backgroundBlurriness = source.backgroundBlurriness;
    this.backgroundIntensity = source.backgroundIntensity;
    this.backgroundRotation.from(source.backgroundRotation);
    this.environmentRotation.from(source.environmentRotation);

    if (source.overrideMaterial) this.overrideMaterial = source.overrideMaterial.clone();

    this.matrixAutoUpdate = source.matrixAutoUpdate;

    return this;
  }
}

Scene.prototype.isScene = true;
