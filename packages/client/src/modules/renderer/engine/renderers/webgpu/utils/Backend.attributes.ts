import { Float16BufferAttribute, InstancedBufferAttribute, InterleavedBufferAttribute } from '../../../engine.js';
import { GPUInputStepModeType } from './constants.js';
import { Backend } from '@modules/renderer/engine/renderers/webgpu/Backend.js';
import RenderObject from '@modules/renderer/engine/renderers/common/RenderObject.js';
import StorageBufferAttribute from '@modules/renderer/engine/renderers/common/StorageBufferAttribute.js';
import { Attribute } from '@modules/renderer/engine/core/types.js';

export class BackendAttributes {
  constructor(public backend: Backend) {}

  createAttribute(attribute: Attribute, usage: GPUBufferUsageFlags): void {
    const bufferAttribute = this._getBufferAttribute(attribute);

    const backend = this.backend;
    const bufferData = backend.get(bufferAttribute);

    let buffer = bufferData.buffer;

    if (buffer === undefined) {
      const device = backend.device;

      let array = bufferAttribute.array;

      if (
        (isStorageBufferAttribute(bufferAttribute) || isStorageInstancedBufferAttribute(bufferAttribute)) &&
        bufferAttribute.itemSize === 3
      ) {
        bufferAttribute.itemSize = 4;
        array = new array.constructor(bufferAttribute.count * 4);

        for (let i = 0; i < bufferAttribute.count; i++) {
          array.set(bufferAttribute.array.subarray(i * 3, i * 3 + 3), i * 4);
        }
      }

      const size = array.byteLength + ((4 - (array.byteLength % 4)) % 4); // ensure 4 byte alignment, see #20441

      buffer = device.createBuffer({
        label: bufferAttribute.name,
        size: size,
        usage: usage,
        mappedAtCreation: true,
      });

      new array.constructor(buffer.getMappedRange()).set(array);

      buffer.unmap();

      bufferData.buffer = buffer;
    }
  }

  updateAttribute(attribute: Attribute): void {
    const bufferAttribute = this._getBufferAttribute(attribute);

    const backend = this.backend;
    const device = backend.device;

    const buffer = backend.get(bufferAttribute).buffer;

    const array = bufferAttribute.array;
    const updateRanges = bufferAttribute.updateRanges;

    if (updateRanges.length === 0) {
      // Not using update ranges

      device.queue.writeBuffer(buffer, 0, array, 0);
    } else {
      for (let i = 0, l = updateRanges.length; i < l; i++) {
        const range = updateRanges[i];
        device.queue.writeBuffer(
          buffer,
          0,
          array,
          range.start * array.BYTES_PER_ELEMENT,
          range.count * array.BYTES_PER_ELEMENT,
        );
      }

      bufferAttribute.clearUpdateRanges();
    }
  }

  createShaderVertexBuffers(renderObject: RenderObject): Attribute[] {
    const attributes = renderObject.getAttributes();
    const vertexBuffers = new Map();

    for (let slot = 0; slot < attributes.length; slot++) {
      const geometryAttribute = attributes[slot];
      const bytesPerElement = geometryAttribute.array.BYTES_PER_ELEMENT;
      const bufferAttribute = this._getBufferAttribute(geometryAttribute);

      let vertexBufferLayout = vertexBuffers.get(bufferAttribute);

      if (vertexBufferLayout === undefined) {
        let arrayStride, stepMode;

        if (geometryAttribute.isInterleavedBufferAttribute === true) {
          arrayStride = geometryAttribute.data.stride * bytesPerElement;
          stepMode = geometryAttribute.data.isInstancedInterleavedBuffer
            ? GPUInputStepModeType.Instance
            : GPUInputStepModeType.Vertex;
        } else {
          arrayStride = geometryAttribute.itemSize * bytesPerElement;
          stepMode = geometryAttribute.isInstancedBufferAttribute
            ? GPUInputStepModeType.Instance
            : GPUInputStepModeType.Vertex;
        }

        vertexBufferLayout = {
          arrayStride,
          attributes: [],
          stepMode,
        };

        vertexBuffers.set(bufferAttribute, vertexBufferLayout);
      }

      const format = this._getVertexFormat(geometryAttribute);
      const offset =
        geometryAttribute.isInterleavedBufferAttribute === true ? geometryAttribute.offset * bytesPerElement : 0;

      vertexBufferLayout.attributes.push({
        shaderLocation: slot,
        offset,
        format,
      });
    }

    return Array.from(vertexBuffers.values());
  }

  destroyAttribute(attribute: Attribute): void {
    this.backend.get(this._getBufferAttribute(attribute)).buffer.destroy();
    this.backend.delete(attribute);
  }

  async getArrayBuffer(attribute: Attribute): Promise<ArrayBuffer> {
    const backend = this.backend;
    const device = backend.device;

    const data = backend.get(this._getBufferAttribute(attribute));

    const bufferGPU = data.buffer;
    const size = bufferGPU.size;

    let readBufferGPU = data.readBuffer;
    let needsUnmap = true;

    if (readBufferGPU === undefined) {
      readBufferGPU = device.createBuffer({
        label: attribute.name,
        size,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      });

      needsUnmap = false;

      data.readBuffer = readBufferGPU;
    }

    const cmdEncoder = device.createCommandEncoder({});

    cmdEncoder.copyBufferToBuffer(bufferGPU, 0, readBufferGPU, 0, size);

    if (needsUnmap) readBufferGPU.unmap();

    const gpuCommands = cmdEncoder.finish();
    device.queue.submit([gpuCommands]);

    await readBufferGPU.mapAsync(GPUMapMode.READ);

    return readBufferGPU.getMappedRange();
  }

  _getVertexFormat(attribute: Attribute): GPUVertexFormat {
    const { itemSize, normalized } = attribute;
    const ArrayType = attribute.array.constructor;
    const AttributeType = attribute.constructor;

    let format;

    if (itemSize == 1) {
      if (ArrayType === Int32Array) {
        format = 'sint32';
      } else if (ArrayType === Uint32Array) {
        format = 'uint32';
      } else if (ArrayType === Float32Array) {
        format = 'float32';
      }
    } else {
      let options!: string[];

      if (AttributeType === Float16BufferAttribute) {
        options = ['float16'];
      } else if (ArrayType == Int8Array) {
        options = ['sint8', 'snorm8'];
      } else if (ArrayType == Uint8Array) {
        options = ['uint8', 'unorm8'];
      } else if (ArrayType == Int16Array) {
        options = ['sint16', 'snorm16'];
      } else if (ArrayType == Uint16Array) {
        options = ['uint16', 'unorm16'];
      } else if (ArrayType == Int32Array) {
        options = ['sint32', 'snorm32'];
      } else if (ArrayType == Uint32Array) {
        options = ['uint32', 'unorm32'];
      } else if (ArrayType == Float32Array) {
        options = ['float32'];
      }

      const prefix = options[normalized ? 1 : 0];

      if (prefix) {
        const bytesPerUnit = ArrayType.BYTES_PER_ELEMENT * itemSize;
        const paddedBytesPerUnit = Math.floor((bytesPerUnit + 3) / 4) * 4;
        const paddedItemSize = paddedBytesPerUnit / ArrayType.BYTES_PER_ELEMENT;

        format = `${prefix}x${paddedItemSize}`;
      }
    }

    return format;
  }

  _getBufferAttribute(attribute: Attribute): Attribute {
    if (isInterleavedBufferAttribute(attribute)) attribute = attribute.data as unknown as Attribute;
    return attribute;
  }
}

const isInterleavedBufferAttribute = (item: any): item is InterleavedBufferAttribute =>
  item.isInterleavedBufferAttribute;
const isStorageBufferAttribute = (item: any): item is StorageBufferAttribute => item.isStorageBufferAttribute;
const isStorageInstancedBufferAttribute = (item: any): item is InstancedBufferAttribute =>
  item.isStorageInstancedBufferAttribute;
