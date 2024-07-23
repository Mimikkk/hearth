import DataMap from './DataMap.js';
import { AttributeType } from './Constants.js';
import { BufferAttribute, BufferUsage, InterleavedBufferAttribute } from '@modules/renderer/engine/engine.js';
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

  update(attribute: AttributeType, type: AttributeType) {
    const data = this.get(attribute);

    if (data.version === undefined) {
      if (type === AttributeType.Vertex) {
        this.renderer.backend.createAttribute(attribute);
      } else if (type === AttributeType.Index) {
        this.renderer.backend.createIndexAttribute(attribute);
      } else if (type === AttributeType.Storage) {
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

  _getBufferAttribute(attribute: AttributeType): BufferAttribute<any> {
    if (attribute instanceof InterleavedBufferAttribute) attribute = attribute.data as unknown as BufferAttribute<any>;
    return attribute;
  }
}

export default Attributes;
