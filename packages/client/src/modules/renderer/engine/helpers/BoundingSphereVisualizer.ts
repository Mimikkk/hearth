import { Entity } from '@modules/renderer/engine/core/Entity.js';
import { SphereGeometry } from '@modules/renderer/engine/geometries/SphereGeometry.js';
import { Random } from '@modules/renderer/engine/math/random.js';
import { Mesh } from '@modules/renderer/engine/objects/Mesh.js';
import {
  MeshLambertMaterial,
  MeshLambertMaterialParameters,
} from '@modules/renderer/engine/objects/materials/MeshLambertMaterial.js';
import { Sphere } from '@modules/renderer/engine/math/Sphere.js';

export class BoundingSphereVisualizer {
  object: Entity;
  bound: Mesh;

  constructor(object: Entity, parameters?: MeshLambertMaterialParameters) {
    if (!object.boundingSphere) object.geometry!.computeBoundingSphere();

    const sphere = object.geometry!.boundingSphere as Sphere;

    if (!parameters) parameters = {};
    parameters.color ??= Random.color();
    parameters.transparent ??= true;
    parameters.opacity ??= 0.2;

    this.bound = new Mesh(new SphereGeometry(sphere.radius), new MeshLambertMaterial(parameters));
    this.bound.material.opacity = 0.2;
    this.bound.material.transparent = true;

    this.bound.position.from(sphere.center);
  }

  static create(object: Entity): BoundingSphereVisualizer {
    return new this(object);
  }

  static attach(object: Entity) {
    const visualizer = new this(object);

    object.add(visualizer.bound);

    return visualizer.bound;
  }
}
