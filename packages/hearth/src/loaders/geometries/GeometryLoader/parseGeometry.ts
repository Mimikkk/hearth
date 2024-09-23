import { Sphere } from '../../../math/Sphere.js';
import { Vec3 } from '../../../math/Vec3.js';
import { Attribute } from '../../../core/Attribute.js';
import { Geometry } from '../../../core/Geometry.js';
import { Buffer } from '../../../core/Buffer.js';
import { createTypedArray } from '../../../math/MathUtils.js';
import { BufferStep } from '../../../hearth/constants.js';

export interface JsonContent {
  interleavedBuffers: Record<string, any>;
  arrayBuffers: Record<string, any>;
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
    boundSphere: {
      center: number[];
      radius: number;
    };
    interleavedBuffers: Record<string, any>;
    arrayBuffers: Record<string, any>;
  };
  name: string;
  extra: Record<string, any>;
}

export const parseGeometry = (json: JsonContent): Geometry => {
  const interleavedBufferMap: Record<string, any> = {};
  const arrayBufferMap: Record<string, any> = {};

  function getInterleavedBuffer(json: any, uuid: string) {
    if (interleavedBufferMap[uuid] !== undefined) return interleavedBufferMap[uuid];

    const interleavedBuffers = json.interleavedBuffers;
    const interleavedBuffer = interleavedBuffers[uuid];

    const buffer = getArrayBuffer(json, interleavedBuffer.buffer);

    const array = createTypedArray(interleavedBuffer.type, buffer);
    const ib = new Buffer(array, interleavedBuffer.stride);

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

  const geometry = new Geometry();

  const index = json.data.index;

  if (index !== undefined) {
    const typedArray = createTypedArray(index.type, index.array) as Uint32Array;
    geometry.index = new Attribute(Buffer.new(typedArray, 1), 1);
  }

  const attributes = json.data.attributes;

  for (const key in attributes) {
    const attribute = attributes[key];
    let bufferAttribute;

    if (attribute.isInterleavedBufferAttribute) {
      const interleavedBuffer = getInterleavedBuffer(json.data, attribute.array);
      bufferAttribute = new Attribute(
        interleavedBuffer,
        attribute.stride,
        attribute.offset,
        BufferStep.Vertex,
        undefined,
        true,
      );
    } else {
      const typedArray = createTypedArray(attribute.type, attribute.array);
      bufferAttribute = new Attribute(
        typedArray,
        attribute.stride,
        0,
        attribute.instanced ? BufferStep.Instance : BufferStep.Vertex,
      );
    }

    if (attribute.name !== undefined) bufferAttribute.name = attribute.name;
    if (attribute.usage !== undefined) bufferAttribute.usage = attribute.usage;

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
          bufferAttribute = new Attribute(
            interleavedBuffer,
            attribute.stride,
            attribute.offset,
            BufferStep.Vertex,
            undefined,
            true,
          );
        } else {
          const typedArray = createTypedArray(attribute.type, attribute.array);
          bufferAttribute = new Attribute(typedArray, attribute.stride);
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

  const boundSphere = json.data.boundSphere;

  if (boundSphere !== undefined) {
    const center = Vec3.new();

    if (boundSphere.center !== undefined) {
      center.fromArray(boundSphere.center);
    }

    geometry.boundSphere = new Sphere(center, boundSphere.radius);
  }

  if (json.name) geometry.name = json.name;
  if (json.extra) geometry.extra = json.extra;

  return geometry as Geometry;
};
