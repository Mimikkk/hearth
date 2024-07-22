import { LightsNode } from '../../nodes/Nodes.js';
import { Light } from '@modules/renderer/engine/lights/Light.js';
import { Object3D } from '@modules/renderer/engine/core/Object3D.js';
import { BufferGeometry } from '@modules/renderer/engine/core/BufferGeometry.js';
import { Group } from '@modules/renderer/engine/objects/Group.js';
import { Material } from '@modules/renderer/engine/materials/Material.js';

export type SortFn = (a: RenderItem, b: RenderItem) => number;

export interface RenderItem {
  id: number;
  object: Object3D;
  geometry: BufferGeometry | null;
  material: Material;
  groupOrder: number;
  renderOrder: number;
  z: number;
  group: Group | null;
}

export class RenderList {
  renderItems: RenderItem[];
  renderItemsIndex: number;
  lightsNode: LightsNode;
  lightsArray: Light[];
  opaque: RenderItem[];
  transparent: RenderItem[];
  occlusionQueryCount: number;

  constructor() {
    this.renderItems = [];
    this.renderItemsIndex = 0;

    this.opaque = [];
    this.transparent = [];

    this.lightsNode = new LightsNode([]);
    this.lightsArray = [];

    this.occlusionQueryCount = 0;
  }

  begin() {
    this.renderItemsIndex = 0;
    this.opaque.length = 0;
    this.transparent.length = 0;
    this.lightsArray.length = 0;
    this.occlusionQueryCount = 0;

    return this;
  }

  next(
    object: Object3D,
    geometry: BufferGeometry | null,
    material: Material,
    groupOrder: number,
    z: number,
    group: Group | null,
  ) {
    let item = this.renderItems[this.renderItemsIndex];

    if (item === undefined) {
      item = RenderItem.new(object, geometry, material, groupOrder, z, group);

      this.renderItems[this.renderItemsIndex] = item;
    } else {
      item.set(object, geometry, material, groupOrder, z, group);
    }

    this.renderItemsIndex++;

    return item;
  }

  push(
    object: Object3D,
    geometry: BufferGeometry | null,
    material: Material,
    groupOrder: number,
    z: number,
    group: Group | null,
  ) {
    const renderItem = this.next(object, geometry, material, groupOrder, z, group);

    if (object.occlusionTest === true) this.occlusionQueryCount++;

    (material.transparent === true ? this.transparent : this.opaque).push(renderItem);
  }

  unshift(
    object: Object3D,
    geometry: BufferGeometry | null,
    material: Material,
    groupOrder: number,
    z: number,
    group: Group | null,
  ) {
    const renderItem = this.next(object, geometry, material, groupOrder, z, group);

    (material.transparent === true ? this.transparent : this.opaque).unshift(renderItem);
  }

  pushLight(light: Light) {
    this.lightsArray.push(light);
  }

  sort(sortOpaque: SortFn, sortTransparent: SortFn) {
    this.opaque.sort(sortOpaque);
    this.transparent.sort(sortTransparent);
  }

  finish() {
    this.lightsNode.fromLights(this.lightsArray);

    for (let i = this.renderItemsIndex, il = this.renderItems.length; i < il; i++) {
      this.renderItems[i].clear();
    }
  }
}

export class RenderItem {
  constructor(
    public object: Object3D,
    public geometry: BufferGeometry | null,
    public material: Material,
    public groupOrder: number,
    public z: number,
    public group: Group | null,
    public id: number = object.id,
    public renderOrder: number = object.renderOrder,
  ) {}

  static new(
    object: Object3D,
    geometry: BufferGeometry | null,
    material: Material,
    groupOrder: number,
    z: number,
    group: Group | null,
  ) {
    return new RenderItem(object, geometry, material, groupOrder, z, group);
  }

  set(
    object: Object3D,
    geometry: BufferGeometry | null,
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

export default RenderList;
