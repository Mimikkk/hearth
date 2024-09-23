import { Entity } from '../../core/Entity.js';
import { SphereGeometry } from '../geometries/SphereGeometry.js';
import { Random } from '../../math/random.js';
import { Mesh } from '../Mesh.js';
import { MeshLambertMaterial, MeshLambertMaterialParameters } from '../materials/MeshLambertMaterial.js';
import { Sphere } from '../../math/Sphere.js';

export class BoundSphereVisualizer {
  object: Entity;
  bound: Mesh;

  constructor(object: Entity, parameters?: MeshLambertMaterialParameters) {
    if (!object.boundSphere) object.geometry!.calcBoundSphere();

    const sphere = object.geometry!.boundSphere as Sphere;

    if (!parameters) parameters = {};
    parameters.color ??= Random.color();
    parameters.transparent ??= true;
    parameters.opacity ??= 0.2;

    this.bound = new Mesh(new SphereGeometry(sphere.radius), new MeshLambertMaterial(parameters));
    this.bound.material.opacity = 0.2;
    this.bound.material.transparent = true;

    this.bound.position = object.position;
  }

  static create(object: Entity): BoundSphereVisualizer {
    return new this(object);
  }

  static attach(object: Entity) {
    return new this(object).bound;
  }
}
