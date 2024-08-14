import { PointsGeometry } from '@modules/renderer/engine/entities/geometries/PointsGeometry.js';
import { InstancedPointsNodeMaterial } from '@modules/renderer/engine/nodes/materials/InstancedPointsNodeMaterial.js';
import { Mesh } from '@modules/renderer/engine/entities/Mesh.js';

export class InstancedPoints extends Mesh {
  declare isInstancedPoints: true;

  constructor(geometry: PointsGeometry, material: InstancedPointsNodeMaterial) {
    super(geometry, material);
  }
}

InstancedPoints.prototype.isInstancedPoints = true;
