import { InstancedPointsGeometry } from '@modules/renderer/engine/entities/geometries/InstancedPointsGeometry.js';
import { InstancedPointsNodeMaterial } from '@modules/renderer/engine/nodes/materials/InstancedPointsNodeMaterial.js';
import { Mesh } from '@modules/renderer/engine/entities/Mesh.js';

export class InstancedPoints extends Mesh {
  declare isInstancedPoints: true;

  constructor(geometry: InstancedPointsGeometry, material: InstancedPointsNodeMaterial) {
    super(geometry, material);
  }
}

InstancedPoints.prototype.isInstancedPoints = true;
