import { Sphere } from '../math/Sphere.js';
import { Vector3 } from '../math/Vector3.js';
import { BufferAttribute } from '../core/BufferAttribute.js';
import { BufferGeometry } from '../core/BufferGeometry.js';
import { InstancedBufferGeometry } from '../core/InstancedBufferGeometry.js';
import { InstancedBufferAttribute } from '../core/InstancedBufferAttribute.js';
import { InterleavedBufferAttribute } from '../core/InterleavedBufferAttribute.js';
import { InterleavedBuffer } from '../core/InterleavedBuffer.js';
import { createTypedArray } from '../utils.js';
import { Configurable, LoaderAsync } from '@modules/renderer/threejs/loaders/types.js';
import { FileLoader, FileResponseType } from '@modules/renderer/threejs/loaders/FileLoader.js';

interface JsonContent {
  interleavedBuffers: Record<string, any>;
  arrayBuffers: Record<string, any>;
  isInstancedBufferGeometry: boolean;
  data: {
    index: {
      type: string;
      array: number[];
    };
    attributes: Record<string, any>;
    morphAttributes: Record<string, any>;
    morphTargetsRelative: boolean;
    groups: Record<string, any>[];
    drawcalls: Record<string, any>[];
    offsets: Record<string, any>[];
    boundingSphere: {
      center: number[];
      radius: number;
    };
    interleavedBuffers: Record<string, any>;
    arrayBuffers: Record<string, any>;
  };
  name: string;
  userData: Record<string, any>;
}

const parse = (json: JsonContent): BufferGeometry => {
  const interleavedBufferMap: Record<string, any> = {};
  const arrayBufferMap: Record<string, any> = {};

  function getInterleavedBuffer(json: any, uuid: string) {
    if (interleavedBufferMap[uuid] !== undefined) return interleavedBufferMap[uuid];

    const interleavedBuffers = json.interleavedBuffers;
    const interleavedBuffer = interleavedBuffers[uuid];

    const buffer = getArrayBuffer(json, interleavedBuffer.buffer);

    const array = createTypedArray(interleavedBuffer.type, buffer);
    const ib = new InterleavedBuffer(array, interleavedBuffer.stride);
    ib.uuid = interleavedBuffer.uuid;

    interleavedBufferMap[uuid] = ib;

    return ib;
  }

  function getArrayBuffer(json: any, uuid: string) {
    if (arrayBufferMap[uuid] !== undefined) return arrayBufferMap[uuid];

    const arrayBuffers = json.arrayBuffers;
    const arrayBuffer = arrayBuffers[uuid];

    const ab = new Uint32Array(arrayBuffer).buffer;

    arrayBufferMap[uuid] = ab;

    return ab;
  }

  const geometry = json.isInstancedBufferGeometry ? new InstancedBufferGeometry() : new BufferGeometry();

  const index = json.data.index;

  if (index !== undefined) {
    const typedArray = createTypedArray(index.type, index.array);
    geometry.setIndex(new BufferAttribute(typedArray, 1));
  }

  const attributes = json.data.attributes;

  for (const key in attributes) {
    const attribute = attributes[key];
    let bufferAttribute;

    if (attribute.isInterleavedBufferAttribute) {
      const interleavedBuffer = getInterleavedBuffer(json.data, attribute.data);
      bufferAttribute = new InterleavedBufferAttribute(
        interleavedBuffer,
        attribute.itemSize,
        attribute.offset,
        attribute.normalized,
      );
    } else {
      const typedArray = createTypedArray(attribute.type, attribute.array);
      const bufferAttributeConstr = attribute.isInstancedBufferAttribute ? InstancedBufferAttribute : BufferAttribute;
      bufferAttribute = new bufferAttributeConstr(typedArray, attribute.itemSize, attribute.normalized);
    }

    if (attribute.name !== undefined) bufferAttribute.name = attribute.name;
    if (attribute.usage !== undefined) bufferAttribute.setUsage(attribute.usage);

    geometry.setAttribute(key, bufferAttribute);
  }

  const morphAttributes = json.data.morphAttributes;

  if (morphAttributes) {
    for (const key in morphAttributes) {
      const attributeArray = morphAttributes[key];

      const array = [];

      for (let i = 0, il = attributeArray.length; i < il; i++) {
        const attribute = attributeArray[i];
        let bufferAttribute;

        if (attribute.isInterleavedBufferAttribute) {
          const interleavedBuffer = getInterleavedBuffer(json.data, attribute.data);
          bufferAttribute = new InterleavedBufferAttribute(
            interleavedBuffer,
            attribute.itemSize,
            attribute.offset,
            attribute.normalized,
          );
        } else {
          const typedArray = createTypedArray(attribute.type, attribute.array);
          bufferAttribute = new BufferAttribute(typedArray, attribute.itemSize, attribute.normalized);
        }

        if (attribute.name !== undefined) bufferAttribute.name = attribute.name;
        array.push(bufferAttribute);
      }

      geometry.morphAttributes[key] = array;
    }
  }

  const morphTargetsRelative = json.data.morphTargetsRelative;

  if (morphTargetsRelative) {
    geometry.morphTargetsRelative = true;
  }

  const groups = json.data.groups || json.data.drawcalls || json.data.offsets;

  if (groups !== undefined) {
    for (let i = 0, n = groups.length; i !== n; ++i) {
      const group = groups[i];

      geometry.addGroup(group.start, group.count, group.materialIndex);
    }
  }

  const boundingSphere = json.data.boundingSphere;

  if (boundingSphere !== undefined) {
    const center = new Vector3();

    if (boundingSphere.center !== undefined) {
      center.fromArray(boundingSphere.center);
    }

    geometry.boundingSphere = new Sphere(center, boundingSphere.radius);
  }

  if (json.name) geometry.name = json.name;
  if (json.userData) geometry.userData = json.userData;

  return geometry as BufferGeometry;
};

export const BufferGeometryLoader = class<TUrl extends string = string>
  implements LoaderAsync<BufferGeometry, TUrl>, Configurable<Configuration>
{
  static configure(options?: Options): Configuration {
    return {
      headers: options?.headers,
      credentials: options?.credentials ?? 'same-origin',
      responseType: FileResponseType.Json,
    };
  }

  configuration: Configuration;

  constructor(options?: Options) {
    this.configuration = BufferGeometryLoader.configure(options);
  }

  async loadAsync<T extends BufferGeometry, E = unknown>(url: TUrl, handlers?: LoaderAsync.Handlers<E>): Promise<T> {
    const json = await FileLoader.loadAsync(url, this.configuration, handlers);

    return parse(json) as T;
  }

  static async loadAsync<T extends BufferGeometry, TUrl extends string, E = unknown>(
    url: TUrl,
    options?: Options,
    handlers?: LoaderAsync.Handlers<E>,
  ): Promise<T> {
    const loader = new BufferGeometryLoader(options);
    return loader.loadAsync(url, handlers);
  }
};

export namespace BufferGeometryLoader {
  export type Options = Omit<FileLoader.Options, 'responseType'> & {};

  export type Configuration = Omit<FileLoader.Configuration, 'responseType'> & {
    responseType: FileResponseType.Json;
  };
}
type Options = BufferGeometryLoader.Options;
type Configuration = BufferGeometryLoader.Configuration;
