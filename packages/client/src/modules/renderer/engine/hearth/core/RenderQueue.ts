import type { Light } from '@modules/renderer/engine/entities/lights/Light.js';
import type { Entity } from '@modules/renderer/engine/core/Entity.js';
import type { Geometry } from '@modules/renderer/engine/core/Geometry.js';
import type { Group } from '@modules/renderer/engine/entities/Group.js';
import type { Material } from '@modules/renderer/engine/entities/materials/Material.js';
import { LightsNode } from '@modules/renderer/engine/nodes/lighting/LightsNode.js';

export type SortFn = (a: Renderable, b: Renderable) => number;

export class RenderQueue {
  constructor(
    public items: Renderable[] = [],
    public index: number = 0,
    public occlusionQueryCount: number = 0,
    public opaque: Renderable[] = [],
    public lights: Light[] = [],
    public transparent: Renderable[] = [],
    public lightsNode: LightsNode = new LightsNode([]),
  ) {}

  begin() {
    this.index = 0;
    this.opaque.length = 0;
    this.transparent.length = 0;
    this.lights.length = 0;
    this.occlusionQueryCount = 0;

    return this;
  }

  next(
    object: Entity,
    geometry: Geometry | null,
    material: Material,
    groupOrder: number,
    z: number,
    group: Group | null,
  ) {
    let item = this.items[this.index];

    if (item === undefined) {
      item = Renderable.new(object, geometry, material, groupOrder, z, group);

      this.items[this.index] = item;
    } else {
      item.set(object, geometry, material, groupOrder, z, group);
    }

    this.index++;

    return item;
  }

  push(
    object: Entity,
    geometry: Geometry | null,
    material: Material,
    groupOrder: number,
    z: number,
    group: Group | null,
  ) {
    const renderable = this.next(object, geometry, material, groupOrder, z, group);

    if (object.useOcclusion) this.occlusionQueryCount++;

    (material.transparent ? this.transparent : this.opaque).push(renderable);
  }

  unshift(
    object: Entity,
    geometry: Geometry | null,
    material: Material,
    groupOrder: number,
    z: number,
    group: Group | null,
  ) {
    const renderable = this.next(object, geometry, material, groupOrder, z, group);

    (material.transparent ? this.transparent : this.opaque).unshift(renderable);
  }

  sort(sortOpaque: SortFn, sortTransparent: SortFn) {
    this.opaque.sort(sortOpaque);
    this.transparent.sort(sortTransparent);
  }

  finish() {
    this.lightsNode.fromLights(this.lights);

    for (let i = this.index, it = this.items.length; i < it; ++i) {
      this.items[i].clear();
    }
  }
}

export class Renderable {
  constructor(
    public object: Entity,
    public geometry: Geometry | null,
    public material: Material,
    public groupOrder: number,
    public z: number,
    public group: Group | null,
    public id: number = object.id,
    public renderOrder: number = object.renderOrder,
  ) {}

  static new(
    object: Entity,
    geometry: Geometry | null,
    material: Material,
    groupOrder: number,
    z: number,
    group: Group | null,
  ) {
    return new Renderable(object, geometry, material, groupOrder, z, group);
  }

  set(
    object: Entity,
    geometry: Geometry | null,
    material: Material,
    groupOrder: number,
    z: number,
    group: Group | null,
  ) {
    this.id = object.id;
    this.object = object;
    this.geometry = geometry;
    this.material = material;
    this.groupOrder = groupOrder;
    this.renderOrder = object.renderOrder;
    this.z = z;
    this.group = group;
  }

  clear() {
    if (this.id === null) return;
    this.id = null!;
    this.object = null!;
    this.geometry = null!;
    this.material = null!;
    this.groupOrder = null!;
    this.renderOrder = null!;
    this.z = null!;
    this.group = null!;
  }
}

export default RenderQueue;
