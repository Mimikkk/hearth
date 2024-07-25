import { BufferAttribute } from '../../engine.js';
import { GPUVertexStepModeType } from './constants.js';
import { Backend } from '@modules/renderer/engine/renderers/Backend.js';
import RenderObject from '@modules/renderer/engine/renderers/RenderObject.js';
import { AttributeType } from '@modules/renderer/engine/core/types.js';

export class BackendAttributes {
  constructor(public backend: Backend) {}

  createAttribute(attribute: AttributeType, usage: GPUBufferUsageFlags): void {
    const bufferAttribute = attribute;

    const backend = this.backend;
    const bufferData = backend.memo.get(bufferAttribute);

    let buffer = bufferData.buffer;

    if (buffer === undefined) {
      const device = backend.device;

      let array = bufferAttribute.array;

      if (bufferAttribute.isStorageInstancedBufferAttribute && bufferAttribute.stride === 3) {
        bufferAttribute.stride = 4;
        array = new array.constructor(bufferAttribute.count * 4);

        for (let i = 0; i < bufferAttribute.count; i++) {
          array.set(bufferAttribute.array.subarray(i * 3, i * 3 + 3), i * 4);
        }
      }

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
    const bufferAttribute = attribute;

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
      const geometryAttribute: BufferAttribute = attributes[slot];
      const bytesPerElement = geometryAttribute.array.BYTES_PER_ELEMENT;
      const bufferAttribute = geometryAttribute;

      let vertexBufferLayout = vertexBuffers.get(bufferAttribute);

      if (vertexBufferLayout === undefined) {
        vertexBufferLayout = {
          arrayStride: geometryAttribute.source.stride * bytesPerElement,
          attributes: [],
          stepMode: geometryAttribute.step,
        };

        vertexBuffers.set(bufferAttribute, vertexBufferLayout);
      }

      const format = this._getVertexFormat(geometryAttribute);
      const offset = geometryAttribute.isInterleavedBufferAttribute ? geometryAttribute.offset * bytesPerElement : 0;

      vertexBufferLayout.attributes.push({
        shaderLocation: slot,
        offset,
        format,
      });
    }

    return Array.from(vertexBuffers.values());
  }

  destroyAttribute(attribute: AttributeType): void {
    this.backend.memo.get(attribute).buffer.destroy();
    this.backend.memo.delete(attribute);
  }

  async getArrayBuffer(attribute: AttributeType): Promise<ArrayBuffer> {
    const backend = this.backend;
    const device = backend.device;

    const data = backend.memo.get(attribute);

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
    const { span } = attribute;
    const ArrayType = attribute.array.constructor;

    if (span == 1) {
      if (ArrayType === Int32Array) {
        return 'sint32';
      } else if (ArrayType === Uint32Array) {
        return 'uint32';
      } else if (ArrayType === Float32Array) {
        return 'float32';
      }
    } else {
      let prefix: 'sint8' | 'uint8' | 'sint16' | 'uint16' | 'sint32' | 'uint32' | 'float32' | undefined;
      if (ArrayType == Int8Array) {
        prefix = 'sint8';
      } else if (ArrayType == Uint8Array) {
        prefix = 'uint8';
      } else if (ArrayType == Int16Array) {
        prefix = 'sint16';
      } else if (ArrayType == Uint16Array) {
        prefix = 'uint16';
      } else if (ArrayType == Int32Array) {
        prefix = 'sint32';
      } else if (ArrayType == Uint32Array) {
        prefix = 'uint32';
      } else if (ArrayType == Float32Array) {
        prefix = 'float32';
      }

      if (prefix) {
        const perVertex = ArrayType.BYTES_PER_ELEMENT * span;
        // to align to 2 | 4 bytes.
        const bytes = Math.floor((perVertex + 3) / 4) * 4;
        const size = (bytes / ArrayType.BYTES_PER_ELEMENT) as 2 | 4;
        return `${prefix}x${size}`;
      }
    }

    throw new Error('Unsupported attribute type.');
  }
}
