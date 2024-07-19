import { LightsNode } from '../../nodes/Nodes.js';
import { Light } from '@modules/renderer/engine/lights/Light.js';
import { Object3D } from '@modules/renderer/engine/core/Object3D.js';
import { BufferGeometry } from '@modules/renderer/engine/core/BufferGeometry.js';
import { Group } from '@modules/renderer/engine/objects/Group.js';
import { Material } from '@modules/renderer/engine/materials/Material.js';

type SortFn = (a: RenderItem, b: RenderItem) => number;

export class RenderList {
  constructor(
    public items: RenderItem[] = [],
    public activeIndex: number = 0,
    public node: LightsNode = LightsNode.new(),
    public lights: Light[] = [],
    public opaque: RenderItem[] = [],
    public transparent: RenderItem[] = [],
    public occlusionCount: number = 0,
  ) {}

  static empty(): RenderList {
    return new RenderList();
  }

  begin() {
    this.activeIndex = 0;
    this.opaque.length = 0;
    this.transparent.length = 0;
    this.lights.length = 0;
    this.occlusionCount = 0;

    return this;
  }

  next(
    object: Object3D,
    geometry: BufferGeometry,
    material: Material,
    groupOrder: number,
    z: number,
    group: Group | null,
  ) {
    let item = this.items[this.activeIndex];

    if (item) {
      item.set(object, geometry, material, groupOrder, z, group);
    } else {
      item = RenderItem.new(object, geometry, material, groupOrder, z, group);
      this.items[this.activeIndex] = item;
    }

    ++this.activeIndex;

    return item;
  }

  listOf({ material }: RenderItem): RenderItem[] {
    return material.transparent ? this.transparent : this.opaque;
  }

  push(
    object: Object3D,
    geometry: BufferGeometry,
    material: Material,
    groupOrder: number,
    z: number,
    group: Group | null,
  ) {
    const item = this.next(object, geometry, material, groupOrder, z, group);

    if (object.useOcclusion) ++this.occlusionCount;

    this.listOf(item).push(item);
  }

  unshift(
    object: Object3D,
    geometry: BufferGeometry,
    material: Material,
    groupOrder: number,
    z: number,
    group: Group | null,
  ) {
    const item = this.next(object, geometry, material, groupOrder, z, group);
    this.listOf(item).unshift(item);
  }

  sort(sortOpaque: SortFn, sortTransparent: SortFn) {
    if (this.opaque.length > 1) this.opaque.sort(sortOpaque);
    if (this.transparent.length > 1) this.transparent.sort(sortTransparent);
  }

  finish() {
    this.node.fromLights(this.lights);
    for (let i = this.activeIndex, it = this.items.length; i < it; ++i) this.items[i].clear();
  }
}

export class RenderItem {
  constructor(
    public object: Object3D,
    public geometry: BufferGeometry,
    public material: Material,
    public groupOrder: number,
    public z: number,
    public group: Group | null,
    public id: number = object.id,
    public renderOrder: number = object.renderOrder,
  ) {}

  static new(
    object: Object3D,
    geometry: BufferGeometry,
    material: Material,
    groupOrder: number,
    z: number,
    group: Group | null,
  ): RenderItem {
    return new RenderItem(object, geometry, material, groupOrder, z, group);
  }

  set(
    object: Object3D,
    geometry: BufferGeometry,
    material: Material,
    groupOrder: number,
    z: number,
    group: Group | null,
  ): this {
    this.object = object;
    this.geometry = geometry;
    this.material = material;
    this.groupOrder = groupOrder;
    this.z = z;
    this.group = group;
    this.id = object.id;
    this.renderOrder = object.renderOrder;
    return this;
  }

  clear(): this {
    if (this.id === null) return this;
    this.object = null!;
    this.geometry = null!;
    this.material = null!;
    this.group = null!;
    this.id = null!;
    this.renderOrder = null!;
    return this;
  }
}
