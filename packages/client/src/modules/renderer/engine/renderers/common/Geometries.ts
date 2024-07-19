import DataMap from './DataMap.js';
import { AttributeType } from './Constants.js';
import { Uint32BufferAttribute, Uint16BufferAttribute, WireframeGeometry } from '@modules/renderer/engine/engine.js';
import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import RenderObject from '@modules/renderer/engine/renderers/common/RenderObject.js';
import { Attribute } from '@modules/renderer/engine/renderers/common/Attributes.js';
import { isArrayUint32 } from '@modules/renderer/engine/utils.js';

function getWireframeVersion(geometry: WireframeGeometry): number {
  //@ts-expect-error
  return geometry.index !== null ? geometry.index.version : geometry.attributes.position.version;
}

function getWireframeIndex(geometry: WireframeGeometry): Uint16BufferAttribute | Uint32BufferAttribute {
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

  const attribute = new (isArrayUint32(indices) ? Uint32BufferAttribute : Uint16BufferAttribute)(indices, 1);
  attribute.version = getWireframeVersion(geometry);

  return attribute;
}

export class Geometries extends DataMap<any, any> {
  wireframes: WeakMap<any, any>;
  attributeCall: WeakMap<any, any>;

  constructor(public renderer: Renderer) {
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

    this.renderer.info.memory.geometries++;

    const onDispose = () => {
      this.renderer.info.memory.geometries--;

      const index = geometry.index;
      const geometryAttributes = renderObject.getAttributes();

      if (index !== null) {
        this.renderer._attributes.delete(index);
      }

      for (const geometryAttribute of geometryAttributes) {
        this.renderer._attributes.delete(geometryAttribute);
      }

      const wireframeAttribute = this.wireframes.get(geometry);

      if (wireframeAttribute !== undefined) {
        this.renderer._attributes.delete(wireframeAttribute);
      }

      geometry.eventDispatcher.remove('dispose', onDispose);
    };

    geometry.eventDispatcher.add('dispose', onDispose);
  }

  updateAttributes(renderObject: RenderObject) {
    const attributes = renderObject.getAttributes();

    for (const attribute of attributes) {
      this.updateAttribute(attribute, AttributeType.Vertex);
    }

    const index = this.getIndex(renderObject);

    if (index !== null) {
      this.updateAttribute(index, AttributeType.Index);
    }
  }

  updateAttribute(attribute: Attribute, type: AttributeType) {
    const callId = this.renderer.info.render.passes;

    if (this.attributeCall.get(attribute) !== callId) {
      this.renderer._attributes.update(attribute, type);

      this.attributeCall.set(attribute, callId);
    }
  }

  getIndex(renderObject: RenderObject) {
    const { geometry, material } = renderObject;

    let index = geometry.index;

    //@ts-expect-error
    if (material.wireframe === true) {
      const wireframes = this.wireframes;

      let wireframeAttribute = wireframes.get(geometry);

      if (wireframeAttribute === undefined) {
        wireframeAttribute = getWireframeIndex(geometry);

        wireframes.set(geometry, wireframeAttribute);
      } else if (wireframeAttribute.version !== getWireframeVersion(geometry)) {
        this.renderer._attributes.delete(wireframeAttribute);

        wireframeAttribute = getWireframeIndex(geometry);

        wireframes.set(geometry, wireframeAttribute);
      }

      index = wireframeAttribute;
    }

    return index;
  }
}

export default Geometries;
