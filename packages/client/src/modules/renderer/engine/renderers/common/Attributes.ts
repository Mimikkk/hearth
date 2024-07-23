import DataMap from './DataMap.js';
import { AttributeLocation } from './Constants.js';
import { BufferUsage, InterleavedBufferAttribute } from '@modules/renderer/engine/engine.js';
import type { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import { AttributeType } from '@modules/renderer/engine/core/types.js';

export class Attributes extends DataMap<AttributeType, any> {
  constructor(public renderer: Renderer) {
    super();
  }

  delete(attribute: AttributeType) {
    const data = super.delete(attribute);

    if (data !== undefined) {
      this.renderer.backend.destroyAttribute(attribute);
    }

    return data;
  }

  update(attribute: AttributeType, type: AttributeLocation) {
    const data = this.get(attribute);

    if (data.version === undefined) {
      if (type === AttributeLocation.Vertex) {
        this.renderer.backend.createAttribute(attribute);
      } else if (type === AttributeLocation.Index) {
        this.renderer.backend.createIndexAttribute(attribute);
      } else if (type === AttributeLocation.Storage) {
        this.renderer.backend.createStorageAttribute(attribute);
      }

      data.version = this._getBufferAttribute(attribute).version;
    } else {
      const buffer = this._getBufferAttribute(attribute);

      if (data.version < buffer.version || buffer.usage === BufferUsage.DynamicDraw) {
        this.renderer.backend.updateAttribute(attribute);

        data.version = buffer.version;
      }
    }
  }

  _getBufferAttribute(attribute: AttributeType): AttributeType {
    if (attribute instanceof InterleavedBufferAttribute) attribute = attribute.data as unknown as AttributeType;
    return attribute;
  }
}

export default Attributes;
