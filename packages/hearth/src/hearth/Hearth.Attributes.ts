import DataMap from './memo/DataMap.js';
import { AttributeLocation } from './constants.js';
import type { Hearth } from './Hearth.js';
import { RenderObject } from './core/RenderObject.js';
import { Memo } from './memo/Memo.js';
import { Attribute } from '../core/Attribute.js';
import { BufferUse } from '../constants.js';

export class HearthAttributes extends DataMap<Attribute, any> {
  constructor(public hearth: Hearth) {
    super();
  }

  delete(attribute: Attribute) {
    const data = super.delete(attribute);

    if (data !== undefined) {
      this.hearth.destroyAttribute(attribute);
    }

    return data;
  }

  update(attribute: Attribute, type: AttributeLocation) {
    const data = this.get(attribute);

    if (data.version === undefined) {
      if (type === AttributeLocation.Vertex) {
        this.hearth.createAttribute(attribute);
      } else if (type === AttributeLocation.Index) {
        this.hearth.createIndexAttribute(attribute);
      } else if (type === AttributeLocation.Storage) {
        this.hearth.createStorageAttribute(attribute);
      }

      data.version = attribute.version;
    } else {
      const buffer = attribute;

      if (data.version < buffer.version || buffer.usage === BufferUse.DynamicDraw) {
        this.hearth.updateAttribute(attribute);

        data.version = buffer.version;
      }
    }
  }

  async read(attribute: Attribute): Promise<ArrayBuffer> {
    const { memo, device } = this.hearth;

    const data = memo.get(attribute);

    const from: GPUBuffer = data.buffer;
    const size = from.size;

    let into: GPUBuffer = data.readBuffer;
    let unmap = true;
    if (into === undefined) {
      into = device.createBuffer({
        label: attribute.name,
        size,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      });

      unmap = false;
      data.readBuffer = into;
    }

    const command = device.createCommandEncoder();

    command.copyBufferToBuffer(from, 0, into, 0, size);

    if (unmap) into.unmap();

    device.queue.submit([command.finish()]);

    await into.mapAsync(GPUMapMode.READ);
    return into.getMappedRange();
  }

  create(attribute: Attribute, usage: GPUBufferUsageFlags): void {
    const { memo, device } = this.hearth;

    const data = memo.get(attribute);
    if (data.buffer) return;

    let array = attribute.array;
    if (attribute.storage && attribute.stride === 3) {
      attribute.stride = 4;
      array = new array.constructor(attribute.count * 4);

      for (let i = 0; i < attribute.count; i++) array.set(attribute.array.subarray(i * 3, i * 3 + 3), i * 4);
    }

    const size = array.byteLength + ((4 - (array.byteLength % 4)) % 4);

    const buffer = device.createBuffer({ label: attribute.name, size: size, usage: usage, mappedAtCreation: true });
    new array.constructor(buffer.getMappedRange()).set(array);
    buffer.unmap();

    data.buffer = buffer;
  }

  updateAttr(attribute: Attribute): void {
    const { device, memo } = this.hearth;
    const { buffer } = memo.get(attribute);

    device.queue.writeBuffer(buffer, 0, attribute.array, 0);
  }

  deleteAttr(attribute: Attribute): void {
    this.hearth.memo.get(attribute).buffer.destroy();
    this.hearth.memo.delete(attribute);
  }

  layouts(object: RenderObject): GPUVertexBufferLayout[] {
    const attributes = object.getAttributes();
    const buffers = Memo.as<Attribute, GPUVertexBufferLayout>(attribute => ({
      arrayStride: attribute.source.stride * attribute.source.elementByteSize,
      stepMode: attribute.step,
      attributes: [],
    }));

    for (let slot = 0; slot < attributes.length; ++slot) {
      const attribute = attributes[slot];

      (buffers.get(attribute).attributes as GPUVertexAttribute[]).push({
        shaderLocation: slot,
        offset: attribute.offset * attribute.source.elementByteSize,
        format: attribute.format,
      });
    }

    return Array.from(buffers.values());
  }
}
