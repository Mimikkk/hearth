import DataMap from './memo/DataMap.js';
import { AttributeLocation } from './constants.js';
import { Attribute, WireframeGeometry } from '@modules/renderer/engine/engine.js';
import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import RenderObject from '@modules/renderer/engine/hearth/core/RenderObject.js';

function getWireframeVersion(geometry: WireframeGeometry): number {
  return geometry.index !== null ? geometry.index.version : geometry.attributes.position.version;
}

function getWireframeIndex(geometry: WireframeGeometry): Attribute<Uint32Array> {
  const indices = [];

  const geometryIndex = geometry.index;
  const geometryPosition = geometry.attributes.position;

  if (geometryIndex !== null) {
    const array = geometryIndex.array;

    for (let i = 0, l = array.length; i < l; i += 3) {
      const a = array[i + 0];
      const b = array[i + 1];
      const c = array[i + 2];

      indices.push(a, b, b, c, c, a);
    }
  } else {
    const array = geometryPosition.array;

    for (let i = 0, l = array.length / 3 - 1; i < l; i += 3) {
      const a = i + 0;
      const b = i + 1;
      const c = i + 2;

      indices.push(a, b, b, c, c, a);
    }
  }

  const attribute = new Attribute(new Uint32Array(indices), 1);
  attribute.version = getWireframeVersion(geometry);

  return attribute;
}

export class HearthGeometries extends DataMap<any, any> {
  wireframes: WeakMap<any, any>;
  attributeCall: WeakMap<any, any>;

  constructor(public hearth: Hearth) {
    super();

    this.wireframes = new WeakMap();
    this.attributeCall = new WeakMap();
  }

  has(renderObject: RenderObject) {
    const geometry = renderObject.geometry;

    return super.has(geometry) && this.get(geometry).initialized === true;
  }

  updateForRender(renderObject: RenderObject) {
    if (this.has(renderObject) === false) this.initGeometry(renderObject);

    this.updateAttributes(renderObject);
  }

  initGeometry(renderObject: RenderObject) {
    const geometry = renderObject.geometry;
    const geometryData = this.get(geometry);

    geometryData.initialized = true;

    this.hearth.info.memory.geometries++;
  }

  updateAttributes(renderObject: RenderObject) {
    const attributes = renderObject.getAttributes();

    for (const attribute of attributes) {
      this.updateAttribute(attribute, AttributeLocation.Vertex);
    }

    const index = this.getIndex(renderObject);

    if (index !== null) {
      this.updateAttribute(index, AttributeLocation.Index);
    }
  }

  updateAttribute(attribute: Attribute, type: AttributeLocation) {
    const callId = this.hearth.info.render.passes;

    if (this.attributeCall.get(attribute) !== callId) {
      this.hearth.attributes.update(attribute, type);

      this.attributeCall.set(attribute, callId);
    }
  }

  getIndex(renderObject: RenderObject) {
    const { geometry, material } = renderObject;

    let index = geometry.index;

    if (material.wireframe === true) {
      const wireframes = this.wireframes;

      let wireframeAttribute = wireframes.get(geometry);

      if (wireframeAttribute === undefined) {
        wireframeAttribute = getWireframeIndex(geometry);

        wireframes.set(geometry, wireframeAttribute);
      } else if (wireframeAttribute.version !== getWireframeVersion(geometry)) {
        this.hearth.attributes.delete(wireframeAttribute);

        wireframeAttribute = getWireframeIndex(geometry);

        wireframes.set(geometry, wireframeAttribute);
      }

      index = wireframeAttribute;
    }

    return index;
  }
}
