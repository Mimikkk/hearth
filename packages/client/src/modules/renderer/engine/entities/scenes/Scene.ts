import { Entity } from '../../core/Entity.js';
import { Euler } from '../../math/Euler.js';
import type { Fog } from './Fog.js';
import type { Material } from '@modules/renderer/engine/entities/materials/Material.js';
import type { Color } from '../../math/Color.js';
import type { Texture } from '@modules/renderer/engine/entities/textures/Texture.js';
import type { CubeTexture } from '@modules/renderer/engine/entities/textures/CubeTexture.js';
import { EnvironmentNode } from '@modules/renderer/engine/nodes/nodes.js';
import { FogNode } from '@modules/renderer/engine/nodes/fog/FogNode.js';

export class Scene extends Entity {
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
    this.backgroundRotation = new Euler();
    this.environmentRotation = new Euler();
    this.overrideMaterial = null;
  }

  static is(scene: any): scene is Scene {
    return scene?.isScene === true;
  }

  copy(source: this, recursive?: boolean): this {
    super.copy(source, recursive);

    if (source.background !== null) this.background = source.background.clone();
    if (source.environment !== null) this.environment = source.environment.clone();
    if (source.fog !== null) this.fog = source.fog.clone();

    this.backgroundBlurriness = source.backgroundBlurriness;
    this.backgroundIntensity = source.backgroundIntensity;
    this.backgroundRotation.from(source.backgroundRotation);
    this.environmentRotation.from(source.environmentRotation);

    if (source.overrideMaterial !== null) this.overrideMaterial = source.overrideMaterial.clone();

    this.matrixAutoUpdate = source.matrixAutoUpdate;

    return this;
  }
}

Scene.prototype.isScene = true;
