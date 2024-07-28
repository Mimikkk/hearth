import DataMap from './DataMap.js';
import { AttributeLocation } from './constants.js';
import { BufferAttribute, BufferUse } from '@modules/renderer/engine/engine.js';
import type { Renderer } from '@modules/renderer/engine/renderers/Renderer.js';

export class Attributes extends DataMap<BufferAttribute, any> {
  constructor(public renderer: Renderer) {
    super();
  }

  delete(attribute: BufferAttribute) {
    const data = super.delete(attribute);

    if (data !== undefined) {
      this.renderer.backend.destroyAttribute(attribute);
    }

    return data;
  }

  update(attribute: BufferAttribute, type: AttributeLocation) {
    const data = this.get(attribute);

    if (data.version === undefined) {
      if (type === AttributeLocation.Vertex) {
        this.renderer.backend.createAttribute(attribute);
      } else if (type === AttributeLocation.Index) {
        this.renderer.backend.createIndexAttribute(attribute);
      } else if (type === AttributeLocation.Storage) {
        this.renderer.backend.createStorageAttribute(attribute);
      }

      data.version = attribute.version;
    } else {
      const buffer = attribute;

      if (data.version < buffer.version || buffer.usage === BufferUse.DynamicDraw) {
        this.renderer.backend.updateAttribute(attribute);

        data.version = buffer.version;
      }
    }
  }
}

export default Attributes;
