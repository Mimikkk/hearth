import { Attribute } from '../engine.js';
import { Backend } from '@modules/renderer/engine/renderers/Backend.js';
import RenderObject from '@modules/renderer/engine/renderers/RenderObject.js';
import { Memo } from '@modules/renderer/engine/renderers/Memo.js';

export class BackendAttributes {
  constructor(public backend: Backend) {}

  async read(attribute: Attribute): Promise<ArrayBuffer> {
    const { memo, device } = this.backend;

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
    const backend = this.backend;

    const memo = backend.memo.get(attribute);
    if (memo.buffer) return;

    const device = backend.device;
    let array = attribute.array;
    if (attribute.storage && attribute.stride === 3) {
      attribute.stride = 4;
      array = new array.constructor(attribute.count * 4);

      for (let i = 0; i < attribute.count; i++) array.set(attribute.array.subarray(i * 3, i * 3 + 3), i * 4);
    }
    // ensure 4 byte alignment
    const size = array.byteLength + ((4 - (array.byteLength % 4)) % 4);

    const buffer = device.createBuffer({ label: attribute.name, size: size, usage: usage, mappedAtCreation: true });
    new array.constructor(buffer.getMappedRange()).set(array);
    buffer.unmap();

    memo.buffer = buffer;
  }

  update(attribute: Attribute): void {
    const { device, memo } = this.backend;
    const { buffer } = memo.get(attribute);

    device.queue.writeBuffer(buffer, 0, attribute.array, 0);
  }

  delete(attribute: Attribute): void {
    this.backend.memo.get(attribute).buffer.destroy();
    this.backend.memo.delete(attribute);
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
