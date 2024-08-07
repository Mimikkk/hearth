import { Material, MaterialParameters } from '@modules/renderer/engine/entities/materials/Material.js';
import { Color, ColorRepresentation } from '@modules/renderer/engine/math/Color.js';
import { Vec2 } from '@modules/renderer/engine/math/Vec2.js';

export interface LineMaterialParameters extends MaterialParameters {
  alphaToCoverage?: boolean | undefined;
  color?: ColorRepresentation | undefined;
  dashed?: boolean | undefined;
  dashScale?: number | undefined;
  dashSize?: number | undefined;
  dashOffset?: number | undefined;
  gapSize?: number | undefined;
  linewidth?: number | undefined;
  resolution?: Vec2 | undefined;
  wireframe?: boolean | undefined;
  worldUnits?: boolean | undefined;
}

export class LineMaterial extends Material {
  constructor(parameters: LineMaterialParameters) {
    super({ clipping: true });

    this.setValues(parameters);
  }

  get color(): Color {
    return this.uniforms.diffuse.value;
  }

  set color(value: Color) {
    this.uniforms.diffuse.value = value;
  }

  get worldUnits(): boolean {
    return 'WORLD_UN.js' in this.defines;
  }

  set worldUnits(value: boolean) {
    if (value === true) {
      this.defines.WORLD_UNITS = '';
    } else {
      delete this.defines.WORLD_UNITS;
    }
  }

  get linewidth(): number {
    return this.uniforms.linewidth.value;
  }

  set linewidth(value: number) {
    if (!this.uniforms.linewidth) return;
    this.uniforms.linewidth.value = value;
  }

  get dashed(): boolean {
    return 'USE_DASH' in this.defines;
  }

  set dashed(value: boolean) {
    if ((value === true) !== this.dashed) {
      this.needsUpdate = true;
    }

    if (value === true) {
      this.defines.USE_DASH = '';
    } else {
      delete this.defines.USE_DASH;
    }
  }

  get dashScale(): number {
    return this.uniforms.dashScale.value;
  }

  set dashScale(value: number) {
    this.uniforms.dashScale.value = value;
  }

  get dashSize(): number {
    return this.uniforms.dashSize.value;
  }

  set dashSize(value): number {
    this.uniforms.dashSize.value = value;
  }

  get dashOffset(): number {
    return this.uniforms.dashOffset.value;
  }

  set dashOffset(value: number) {
    this.uniforms.dashOffset.value = value;
  }

  get gapSize(): number {
    return this.uniforms.gapSize.value;
  }

  set gapSize(value: number) {
    this.uniforms.gapSize.value = value;
  }

  get opacity(): number {
    return this.uniforms.opacity.value;
  }

  set opacity(value): number {
    if (!this.uniforms) return;
    this.uniforms.opacity.value = value;
  }

  get resolution(): Vec2 {
    return this.uniforms.resolution.value;
  }

  set resolution(value: Vec2) {
    this.uniforms.resolution.value.copy(value);
  }

  get alphaToCoverage(): boolean {
    return 'USE_ALPHA_TO_COVERAGE' in this.defines;
  }

  set alphaToCoverage(value: boolean) {
    if (!this.defines) return;

    if ((value === true) !== this.alphaToCoverage) {
      this.needsUpdate = true;
    }

    if (value === true) {
      this.defines.USE_ALPHA_TO_COVERAGE = '';
      this.extensions.derivatives = true;
    } else {
      delete this.defines.USE_ALPHA_TO_COVERAGE;
      this.extensions.derivatives = false;
    }
  }
}
