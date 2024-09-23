import { PointsGeometry } from './geometries/PointsGeometry.js';
import { InstancedPointsNodeMaterial } from '../nodes/materials/InstancedPointsNodeMaterial.js';
import { Mesh } from './Mesh.js';

export class InstancedPoints extends Mesh {
  declare isInstancedPoints: true;

  constructor(geometry: PointsGeometry, material: InstancedPointsNodeMaterial) {
    super(geometry, material);
  }
}

InstancedPoints.prototype.isInstancedPoints = true;
