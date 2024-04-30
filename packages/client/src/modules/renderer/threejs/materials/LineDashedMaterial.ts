import { LineBasicMaterial, LineBasicMaterialParameters } from './LineBasicMaterial.js';

export interface LineDashedMaterialParameters extends LineBasicMaterialParameters {
  scale?: number | undefined;
  dashSize?: number | undefined;
  gapSize?: number | undefined;
}

export class LineDashedMaterial extends LineBasicMaterial {
  declare isLineDashedMaterial: true;
  declare type: string;

  scale: number;
  dashSize: number;
  gapSize: number;

  constructor(parameters: LineDashedMaterialParameters) {
    super(parameters);

    this.isLineDashedMaterial = true;

    this.type = 'LineDashedMaterial';

    this.scale = 1;
    this.dashSize = 3;
    this.gapSize = 1;
  }

  setValues(values: LineDashedMaterialParameters): void {
    super.setValues(values);
  }

  copy(source: this): this {
    super.copy(source);
    this.scale = source.scale;
    this.dashSize = source.dashSize;
    this.gapSize = source.gapSize;
    return this;
  }
}

LineDashedMaterial.prototype.isLineDashedMaterial = true;
LineDashedMaterial.prototype.type = 'LineDashedMaterial';
