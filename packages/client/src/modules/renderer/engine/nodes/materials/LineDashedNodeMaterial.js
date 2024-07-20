import { NodeMaterial } from './NodeMaterial.js';
import { attribute } from '../core/AttributeNode.js';
import { varying } from '../core/VaryingNode.js';
import { materialLineDashSize, materialLineGapSize, materialLineScale } from '../accessors/MaterialNode.js';
import { dashSize, gapSize } from '../core/PropertyNode.js';
import { float } from '../shadernode/ShaderNodes.js';
import { LineDashedMaterial } from '@modules/renderer/engine/engine.ts';

const defaultValues = new LineDashedMaterial();

export class LineDashedNodeMaterial extends NodeMaterial {
  static type = 'LineDashedNodeMaterial';

  constructor(parameters) {
    super();

    this.isLineDashedNodeMaterial = true;

    this.lights = false;
    this.normals = false;

    this.setDefaultValues(defaultValues);

    this.offsetNode = null;
    this.dashScaleNode = null;
    this.dashSizeNode = null;
    this.gapSizeNode = null;

    this.setValues(parameters);
  }

  setupVariants() {
    const offsetNode = this.offsetNode;
    const dashScaleNode = this.dashScaleNode ? float(this.dashScaleNode) : materialLineScale;
    const dashSizeNode = this.dashSizeNode ? float(this.dashSizeNode) : materialLineDashSize;
    const gapSizeNode = this.dashSizeNode ? float(this.dashGapNode) : materialLineGapSize;

    dashSize.assign(dashSizeNode);
    gapSize.assign(gapSizeNode);

    const vLineDistance = varying(attribute('lineDistance').mul(dashScaleNode));
    const vLineDistanceOffset = offsetNode ? vLineDistance.add(offsetNode) : vLineDistance;

    vLineDistanceOffset.mod(dashSize.add(gapSize)).greaterThan(dashSize).discard();
  }
}
