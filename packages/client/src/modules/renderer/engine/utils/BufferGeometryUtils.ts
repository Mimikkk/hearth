import { BufferAttribute, DrawMode, Geometry } from '../engine.js';
import { AttributeType } from '@modules/renderer/engine/core/types.js';
import { ArrayConstructorMap, TypedArray } from '@modules/renderer/engine/math/MathUtils.js';

export function mergeAttributes<T extends TypedArray>(attributes: AttributeType<T>[]): BufferAttribute<T> {
  let itemSize: number = attributes[0].itemSize;

  let length = 0;
  for (const { count } of attributes) {
    length += count * itemSize;
  }

  const array = new (attributes[0].array.constructor as ArrayConstructorMap<T>)(length) as T;
  const result = new BufferAttribute<T>(array as T, itemSize);
  let offset = 0;

  for (let i = 0; i < attributes.length; ++i) {
    const attribute = attributes[i];
    if (attribute.isInterleavedBufferAttribute) {
      const tupleOffset = offset / itemSize;
      for (let j = 0, l = attribute.count; j < l; j++) {
        for (let c = 0; c < itemSize; c++) {
          const value = attribute.getComponent(j, c);
          result.setComponent(j + tupleOffset, c, value);
        }
      }
    } else {
      array.set(attribute.array, offset);
    }

    offset += attribute.count * itemSize;
  }

  return result;
}

export function mergeGeometries(geometries: Geometry[], useGroups?: boolean): Geometry {
  const isIndexed = geometries[0].index !== null;

  const attributesUsed = new Set(Object.keys(geometries[0].attributes));
  const morphAttributesUsed = new Set(Object.keys(geometries[0].morphAttributes));

  const attributes = {};
  const morphAttributes = {};

  const mergedGeometry = new Geometry();

  let offset = 0;

  for (let i = 0; i < geometries.length; ++i) {
    const geometry = geometries[i];
    let attributesCount = 0;

    for (const name in geometry.attributes) {
      if (!attributesUsed.has(name)) {
        console.error(
          'engine.BufferGeometryUtils: .mergeGeometries() failed with geometry at index ' +
            i +
            '. All geometries must have compatible attributes; make sure "' +
            name +
            '" attribute exists among all geometries, or in none of them.',
        );
        return null;
      }

      if (attributes[name] === undefined) attributes[name] = [];

      attributes[name].push(geometry.attributes[name]);

      attributesCount++;
    }

    for (const name in geometry.morphAttributes) {
      if (!morphAttributesUsed.has(name)) {
        console.error(
          'engine.BufferGeometryUtils: .mergeGeometries() failed with geometry at index ' +
            i +
            '.  .morphAttributes must be consistent throughout all geometries.',
        );
        return null;
      }

      if (morphAttributes[name] === undefined) morphAttributes[name] = [];

      morphAttributes[name].push(geometry.morphAttributes[name]);
    }

    if (useGroups) {
      let count;

      if (isIndexed) {
        count = geometry.index.count;
      } else {
        count = geometry.attributes.position.count;
      }

      mergedGeometry.addGroup(offset, count, i);

      offset += count;
    }
  }

  if (isIndexed) {
    let indexOffset = 0;
    const mergedIndex = [];

    for (let i = 0; i < geometries.length; ++i) {
      const index = geometries[i].index;

      for (let j = 0; j < index.count; ++j) {
        mergedIndex.push(index.getX(j) + indexOffset);
      }

      indexOffset += geometries[i].attributes.position.count;
    }

    mergedGeometry.setIndex(mergedIndex);
  }

  for (const name in attributes) {
    const mergedAttribute = mergeAttributes(attributes[name]);

    mergedGeometry.setAttribute(name, mergedAttribute);
  }

  for (const name in morphAttributes) {
    const numMorphTargets = morphAttributes[name][0].length;

    if (numMorphTargets === 0) break;

    mergedGeometry.morphAttributes = mergedGeometry.morphAttributes || {};
    mergedGeometry.morphAttributes[name] = [];

    for (let i = 0; i < numMorphTargets; ++i) {
      const morphAttributesToMerge = [];

      for (let j = 0; j < morphAttributes[name].length; ++j) {
        morphAttributesToMerge.push(morphAttributes[name][j][i]);
      }

      const mergedMorphAttribute = mergeAttributes(morphAttributesToMerge);

      if (!mergedMorphAttribute) {
        console.error(
          'engine.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the ' +
            name +
            ' morphAttribute.',
        );
        return null;
      }

      mergedGeometry.morphAttributes[name].push(mergedMorphAttribute);
    }
  }

  return mergedGeometry;
}

export function toTrianglesDrawMode(geometry: Geometry, drawMode: DrawMode): Geometry {
  if (drawMode === DrawMode.Triangles) return geometry;
  let index = geometry.index;
  const indices = [];
  const position = geometry.attributes.position;

  if (position) {
    for (let i = 0; i < position.count; i++) {
      indices.push(i);
    }

    geometry.setIndex(indices);
    index = geometry.index;
  }

  const numberOfTriangles = index.count - 2;
  const newIndices = [];

  if (drawMode === DrawMode.TriangleFan) {
    for (let i = 1; i <= numberOfTriangles; i++) {
      newIndices.push(index.getX(0));
      newIndices.push(index.getX(i));
      newIndices.push(index.getX(i + 1));
    }
  } else {
    for (let i = 0; i < numberOfTriangles; i++) {
      if (i % 2 === 0) {
        newIndices.push(index.getX(i));
        newIndices.push(index.getX(i + 1));
        newIndices.push(index.getX(i + 2));
      } else {
        newIndices.push(index.getX(i + 2));
        newIndices.push(index.getX(i + 1));
        newIndices.push(index.getX(i));
      }
    }
  }

  const newGeometry = geometry.clone();
  newGeometry.setIndex(newIndices);
  newGeometry.clearGroups();

  return newGeometry;
}
