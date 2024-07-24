import { Mesh } from '../engine.js';
import { InstancedPointsGeometry } from '@modules/renderer/engine/objects/geometries/InstancedPointsGeometry.js';
import { InstancedPointsNodeMaterial } from '@modules/renderer/engine/nodes/materials/InstancedPointsNodeMaterial.js';

export class InstancedPoints extends Mesh {
  declare isInstancedPoints: true;
  declare type: string | 'InstancedPoints';

  constructor(geometry: InstancedPointsGeometry, material: InstancedPointsNodeMaterial) {
    super(geometry, material);
  }
}

InstancedPoints.prototype.isInstancedPoints = true;
InstancedPoints.prototype.type = 'InstancedPoints';
