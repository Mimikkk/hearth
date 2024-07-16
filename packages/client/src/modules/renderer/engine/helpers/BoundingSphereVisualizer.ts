import { Object3D } from '@modules/renderer/engine/core/Object3D.js';
import { SphereGeometry } from '@modules/renderer/engine/geometries/SphereGeometry.js';
import { Random } from '@modules/renderer/engine/math/random.js';
import { Mesh } from '@modules/renderer/engine/objects/Mesh.js';
import {
  MeshLambertMaterial,
  MeshLambertMaterialParameters,
} from '@modules/renderer/engine/materials/MeshLambertMaterial.js';
import { Sphere } from '@modules/renderer/engine/math/Sphere.js';
import { IVec3 } from '@modules/renderer/engine/math/Vector3.js';

export class BoundingSphereVisualizer {
  object: Object3D;
  bound: Mesh;

  constructor(object: Object3D, parameters?: MeshLambertMaterialParameters) {
    if (!object.boundingSphere) object.geometry!.computeBoundingSphere();

    const sphere = object.geometry!.boundingSphere as Sphere;

    if (!parameters) parameters = {};
    parameters.color ??= Random.color();
    parameters.transparent ??= true;
    parameters.opacity ??= 0.2;

    this.bound = new Mesh(new SphereGeometry(sphere), new MeshLambertMaterial(parameters));
    IVec3.fill(this.bound.position, sphere.center);
  }

  static create(object: Object3D): BoundingSphereVisualizer {
    return new this(object);
  }

  static attach(object: Object3D) {
    const visualizer = new this(object);

    object.add(visualizer.bound);

    return visualizer.bound;
  }
}
