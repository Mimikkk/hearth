import { ColorRepresentation } from '../../math/Color.js';
import { Texture } from '@modules/renderer/engine/entities/textures/Texture.js';
import { SpotLight } from './SpotLight.js';

export class IESSpotLight extends SpotLight {
  iesMap: Texture | null;

  constructor(
    color: ColorRepresentation,
    intensity: number,
    distance: number = 0,
    angle: number = Math.PI / 3,
    penumbra: number = 0,
    decay: number = 2,
  ) {
    super(color, intensity, distance, angle, penumbra, decay);

    this.iesMap = null;
  }

  copy(source: this, recursive?: boolean): this {
    super.copy(source, recursive);

    this.iesMap = source.iesMap;

    return this;
  }
}
