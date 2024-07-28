import DataMap from './DataMap.js';
import { AttributeLocation } from './constants.js';
import { Attribute, BufferUse } from '@modules/renderer/engine/engine.js';
import type { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';

export class HearthAttributes extends DataMap<Attribute, any> {
  constructor(public hearth: Hearth) {
    super();
  }

  delete(attribute: Attribute) {
    const data = super.delete(attribute);

    if (data !== undefined) {
      this.hearth.backend.destroyAttribute(attribute);
    }

    return data;
  }

  update(attribute: Attribute, type: AttributeLocation) {
    const data = this.get(attribute);

    if (data.version === undefined) {
      if (type === AttributeLocation.Vertex) {
        this.hearth.backend.createAttribute(attribute);
      } else if (type === AttributeLocation.Index) {
        this.hearth.backend.createIndexAttribute(attribute);
      } else if (type === AttributeLocation.Storage) {
        this.hearth.backend.createStorageAttribute(attribute);
      }

      data.version = attribute.version;
    } else {
      const buffer = attribute;

      if (data.version < buffer.version || buffer.usage === BufferUse.DynamicDraw) {
        this.hearth.backend.updateAttribute(attribute);

        data.version = buffer.version;
      }
    }
  }
}
