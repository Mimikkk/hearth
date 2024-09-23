import { NodeMaterial } from './NodeMaterial.js';
import { attribute } from '../core/AttributeNode.js';
import { varying } from '../core/VaryingNode.js';
import { materialLineDashSize, materialLineGapSize, materialLineScale } from '../accessors/MaterialNode.js';
import { dashSize, gapSize } from '../core/PropertyNode.js';
import { f32 } from '../shadernode/ShaderNode.primitves.js';
import { LineDashedMaterial, LineDashedMaterialParameters } from '../../entities/materials/LineDashedMaterial.js';

export class LineDashedNodeMaterial extends NodeMaterial {
  offsetNode: Node | null;
  dashScaleNode: Node | null;
  dashSizeNode: Node | null;
  gapSizeNode: Node | null;

  constructor(parameters?: LineDashedMaterialParameters) {
    super();

    this.lights = false;
    this.normals = false;

    this.setDefaultValues(_parameters);

    this.offsetNode = null;
    this.dashScaleNode = null;
    this.dashSizeNode = null;
    this.gapSizeNode = null;

    this.setValues(parameters);
  }

  setupVariants() {
    const offsetNode = this.offsetNode;
    const dashScaleNode = this.dashScaleNode ? f32(this.dashScaleNode) : materialLineScale;
    const dashSizeNode = this.dashSizeNode ? f32(this.dashSizeNode) : materialLineDashSize;
    const gapSizeNode = this.dashSizeNode ? f32(this.gapSizeNode) : materialLineGapSize;

    dashSize.assign(dashSizeNode);
    gapSize.assign(gapSizeNode);

    const vLineDistance = varying(attribute('lineDistance').mul(dashScaleNode));
    const vLineDistanceOffset = offsetNode ? vLineDistance.add(offsetNode) : vLineDistance;

    vLineDistanceOffset.mod(dashSize.add(gapSize)).greaterThan(dashSize).discard();
  }
}

const _parameters = new LineDashedMaterial();
