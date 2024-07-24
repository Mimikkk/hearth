import { InstancedBufferAttribute, InterleavedBufferAttribute } from '../../engine.js';
import { GPUVertexStepModeType } from './constants.js';
import { Backend } from '@modules/renderer/engine/renderers/Backend.js';
import RenderObject from '@modules/renderer/engine/renderers/RenderObject.js';
import StorageBufferAttribute from '@modules/renderer/engine/core/attributes/StorageBufferAttribute.js';
import { AttributeType } from '@modules/renderer/engine/core/types.js';

export class BackendAttributes {
  constructor(public backend: Backend) {}

  createAttribute(attribute: AttributeType, usage: GPUBufferUsageFlags): void {
    const bufferAttribute = this._getBufferAttribute(attribute);

    const backend = this.backend;
    const bufferData = backend.memo.get(bufferAttribute);

    let buffer = bufferData.buffer;

    if (buffer === undefined) {
      const device = backend.device;

      let array = bufferAttribute.array;

      if (
        (isStorageBufferAttribute(bufferAttribute) || isStorageInstancedBufferAttribute(bufferAttribute)) &&
        bufferAttribute.stride === 3
      ) {
        bufferAttribute.stride = 4;
        array = new array.constructor(bufferAttribute.count * 4);

        for (let i = 0; i < bufferAttribute.count; i++) {
          array.set(bufferAttribute.array.subarray(i * 3, i * 3 + 3), i * 4);
        }
      }

      // ensure 4 byte alignment, see #20441
      const size = array.byteLength + ((4 - (array.byteLength % 4)) % 4);

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

  updateAttribute(attribute: AttributeType): void {
    const bufferAttribute = this._getBufferAttribute(attribute);

    const backend = this.backend;
    const device = backend.device;

    const buffer = backend.memo.get(bufferAttribute).buffer;

    const array = bufferAttribute.array;
    device.queue.writeBuffer(buffer, 0, array, 0);
  }

  createShaderVertexBuffers(renderObject: RenderObject): AttributeType[] {
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
          arrayStride = geometryAttribute.source.stride * bytesPerElement;
          stepMode = geometryAttribute.source.isInstancedInterleavedBuffer
            ? GPUVertexStepModeType.Instance
            : GPUVertexStepModeType.Vertex;
        } else {
          arrayStride = geometryAttribute.stride * bytesPerElement;
          stepMode = geometryAttribute.isInstancedBufferAttribute
            ? GPUVertexStepModeType.Instance
            : GPUVertexStepModeType.Vertex;
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

  destroyAttribute(attribute: AttributeType): void {
    this.backend.memo.get(this._getBufferAttribute(attribute)).buffer.destroy();
    this.backend.memo.delete(attribute);
  }

  async getArrayBuffer(attribute: AttributeType): Promise<ArrayBuffer> {
    const backend = this.backend;
    const device = backend.device;

    const data = backend.memo.get(this._getBufferAttribute(attribute));

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

  _getVertexFormat(attribute: AttributeType): GPUVertexFormat {
    const { stride } = attribute;
    const ArrayType = attribute.array.constructor;

    let format;

    if (stride == 1) {
      if (ArrayType === Int32Array) {
        format = 'sint32';
      } else if (ArrayType === Uint32Array) {
        format = 'uint32';
      } else if (ArrayType === Float32Array) {
        format = 'float32';
      }
    } else {
      let options!: string[];

      if (ArrayType == Int8Array) {
        options = ['sint8'];
      } else if (ArrayType == Uint8Array) {
        options = ['uint8'];
      } else if (ArrayType == Int16Array) {
        options = ['sint16'];
      } else if (ArrayType == Uint16Array) {
        options = ['uint16'];
      } else if (ArrayType == Int32Array) {
        options = ['sint32'];
      } else if (ArrayType == Uint32Array) {
        options = ['uint32'];
      } else if (ArrayType == Float32Array) {
        options = ['float32'];
      }

      const prefix = options[0];

      if (prefix) {
        const bytesPerUnit = ArrayType.BYTES_PER_ELEMENT * stride;
        const paddedBytesPerUnit = Math.floor((bytesPerUnit + 3) / 4) * 4;
        const paddedItemSize = paddedBytesPerUnit / ArrayType.BYTES_PER_ELEMENT;

        format = `${prefix}x${paddedItemSize}`;
      }
    }

    return format;
  }

  _getBufferAttribute(attribute: AttributeType): AttributeType {
    return attribute;
  }
}

const isInterleavedBufferAttribute = (item: any): item is InterleavedBufferAttribute =>
  item.isInterleavedBufferAttribute;
const isStorageBufferAttribute = (item: any): item is StorageBufferAttribute => item.isStorageBufferAttribute;

const isStorageInstancedBufferAttribute = (item: any): item is InstancedBufferAttribute =>
  item.isStorageInstancedBufferAttribute;
