import { LineBasicMaterial, LineBasicMaterialParameters } from './LineBasicMaterial.js';

export interface LineDashedMaterialParameters extends LineBasicMaterialParameters {
  scale?: number;
  dashSize?: number;
  gapSize?: number;
}

export class LineDashedMaterial extends LineBasicMaterial {
  scale: number;
  dashSize: number;
  gapSize: number;

  constructor(parameters?: LineDashedMaterialParameters) {
    super(parameters);

    this.scale = 1;
    this.dashSize = 3;
    this.gapSize = 1;
    this.setValues(parameters);
  }

  setValues(values?: LineDashedMaterialParameters): void {
    super.setValues(values);
  }
}
