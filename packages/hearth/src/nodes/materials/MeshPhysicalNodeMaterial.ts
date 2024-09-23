import { transformedClearcoatNormalView } from '../accessors/NormalNode.js';
import {
  clearcoat,
  clearcoatRoughness,
  iridescence,
  iridescenceIOR,
  iridescenceThickness,
  sheen,
  sheenRoughness,
} from '../core/PropertyNode.js';
import {
  materialClearcoat,
  materialClearcoatNormal,
  materialClearcoatRoughness,
  materialIridescence,
  materialIridescenceIOR,
  materialIridescenceThickness,
  materialSheen,
  materialSheenRoughness,
} from '../accessors/MaterialNode.js';
import { f32, vec3 } from '../shadernode/ShaderNode.primitves.js';
import { PhysicalLightModel } from '../functions/PhysicalLightModel.js';
import { MeshStandardNodeMaterial } from './MeshStandardNodeMaterial.js';
import { MeshPhysicalMaterial, MeshPhysicalMaterialParameters } from '../../entities/materials/MeshPhysicalMaterial.js';
import { NodeBuilder } from '../../nodes/builder/NodeBuilder.js';

export class MeshPhysicalNodeMaterial extends MeshStandardNodeMaterial {
  clearcoatNode: Node | null;
  clearcoatRoughnessNode: Node | null;
  clearcoatNormalNode: Node | null;
  sheenNode: Node | null;
  sheenRoughnessNode: Node | null;
  iridescenceNode: Node | null;
  iridescenceIORNode: Node | null;
  iridescenceThicknessNode: Node | null;
  specularIntensityNode: Node | null;
  specularColorNode: Node | null;
  transmissionNode: Node | null;
  thicknessNode: Node | null;
  attenuationDistanceNode: Node | null;
  attenuationColorNode: Node | null;

  clearcoat: number;
  sheen: number;
  iridescence: number;

  constructor(parameters?: MeshPhysicalMaterialParameters) {
    super();

    this.clearcoatNode = null;
    this.clearcoatRoughnessNode = null;
    this.clearcoatNormalNode = null;

    this.sheenNode = null;
    this.sheenRoughnessNode = null;

    this.iridescenceNode = null;
    this.iridescenceIORNode = null;
    this.iridescenceThicknessNode = null;

    this.specularIntensityNode = null;
    this.specularColorNode = null;

    this.transmissionNode = null;
    this.thicknessNode = null;
    this.attenuationDistanceNode = null;
    this.attenuationColorNode = null;

    this.setDefaultValues(_parameters);
    this.setValues(parameters);
  }

  get useClearcoat() {
    return this.clearcoat > 0 || this.clearcoatNode !== null;
  }

  get useIridescence() {
    return this.iridescence > 0 || this.iridescenceNode !== null;
  }

  get useSheen() {
    return this.sheen > 0 || this.sheenNode !== null;
  }

  setupLightingModel() {
    return new PhysicalLightModel(this.useClearcoat, this.useSheen, this.useIridescence);
  }

  setupVariants(builder: NodeBuilder) {
    super.setupVariants(builder);

    if (this.useClearcoat) {
      const clearcoatNode = this.clearcoatNode ? f32(this.clearcoatNode) : materialClearcoat;
      const clearcoatRoughnessNode = this.clearcoatRoughnessNode
        ? f32(this.clearcoatRoughnessNode)
        : materialClearcoatRoughness;

      clearcoat.assign(clearcoatNode);
      clearcoatRoughness.assign(clearcoatRoughnessNode);
    }
    if (this.useSheen) {
      const sheenNode = this.sheenNode ? vec3(this.sheenNode) : materialSheen;
      const sheenRoughnessNode = this.sheenRoughnessNode ? f32(this.sheenRoughnessNode) : materialSheenRoughness;

      sheen.assign(sheenNode);
      sheenRoughness.assign(sheenRoughnessNode);
    }
    if (this.useIridescence) {
      const iridescenceNode = this.iridescenceNode ? f32(this.iridescenceNode) : materialIridescence;
      const iridescenceIORNode = this.iridescenceIORNode ? f32(this.iridescenceIORNode) : materialIridescenceIOR;
      const iridescenceThicknessNode = this.iridescenceThicknessNode
        ? f32(this.iridescenceThicknessNode)
        : materialIridescenceThickness;

      iridescence.assign(iridescenceNode);
      iridescenceIOR.assign(iridescenceIORNode);
      iridescenceThickness.assign(iridescenceThicknessNode);
    }
  }

  setupNormal(builder: NodeBuilder): void {
    super.setupNormal(builder);

    const clearcoatNormalNode = this.clearcoatNormalNode ? vec3(this.clearcoatNormalNode) : materialClearcoatNormal;

    transformedClearcoatNormalView.assign(clearcoatNormalNode);
  }
}

const _parameters = new MeshPhysicalMaterial();
