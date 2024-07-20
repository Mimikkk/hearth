import { BufferAttribute } from '../core/BufferAttribute.js';
import { BufferGeometry } from '../core/BufferGeometry.js';
import { DataTexture } from '../textures/DataTexture.js';
import { TextureDataType, TextureFormat } from '../constants.js';
import { Mat4 } from '../math/Mat4.js';
import { Mesh } from './Mesh.js';
import { Box3 } from '../math/Box3.js';
import { Sphere } from '../math/Sphere.js';
import { Frustum } from '../math/Frustum.js';
import { Vec3 } from '../math/Vec3.js';
import { Material } from '@modules/renderer/engine/materials/Material.js';
import { Camera } from '@modules/renderer/engine/cameras/Camera.js';
import { Intersection, Raycaster } from '@modules/renderer/engine/core/Raycaster.js';
import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import { Scene } from '@modules/renderer/engine/scenes/Scene.js';
import { Group } from '@modules/renderer/engine/objects/Group.js';

const sortAsc = (a: { z: number }, b: { z: number }): number => a.z - b.z;
const sortDesc = (a: { z: number }, b: { z: number }): number => b.z - a.z;

export class MultiDrawRenderList {
  index: number;
  pool: { start: number; count: number; z: number }[];
  list: { start: number; count: number; z: number }[];

  constructor() {
    this.index = 0;
    this.pool = [];
    this.list = [];
  }

  push(drawRange: { start: number; count: number }, z: number) {
    const pool = this.pool;
    const list = this.list;
    if (this.index >= pool.length) {
      pool.push({
        start: -1,
        count: -1,
        z: -1,
      });
    }

    const item = pool[this.index];
    list.push(item);
    this.index++;

    item.start = drawRange.start;
    item.count = drawRange.count;
    item.z = z;
  }

  reset() {
    this.list.length = 0;
    this.index = 0;
  }
}

const ID_ATTR_NAME = 'batchId';
const _matrix = new Mat4();
const _invMatrixWorld = new Mat4();
const _identityMatrix = new Mat4();
const _projScreenMatrix = new Mat4();
const _frustum = Frustum.empty();
const _box = new Box3();
const _sphere = new Sphere();
const _vector = new Vec3();
const _renderList = new MultiDrawRenderList();
const _mesh = new Mesh(null!, null!);
const _batchIntersects: Intersection[] = [];

function copyAttributeData(src: BufferAttribute, target: BufferAttribute, targetOffset: number) {
  const itemSize = target.itemSize;
  //@ts-expect-error
  if (src.isInterleavedBufferAttribute || src.array.constructor !== target.array.constructor) {
    // use the component getters and setters if the array data cannot
    // be copied directly
    const vertexCount = src.count;
    for (let i = 0; i < vertexCount; i++) {
      for (let c = 0; c < itemSize; c++) {
        target.setComponent(i + targetOffset, c, src.getComponent(i, c));
      }
    }
  } else {
    // faster copy approach using typed array set function
    target.array.set(src.array, targetOffset * itemSize);
  }

  target.needsUpdate = true;
}

export class BatchedMesh extends Mesh {
  declare isBatchedMesh: true;
  perObjectFrustumCulled: boolean;
  sortObjects: boolean;
  boundingBox: Box3 | null;
  boundingSphere: Sphere | null;
  customSort: ((list: { start: number; count: number; z: number }[], camera: Camera) => void) | null;
  _drawRanges: { start: number; count: number }[];
  _reservedRanges: { vertexStart: number; vertexCount: number; indexStart: number; indexCount: number }[];
  _visibility: boolean[];
  _active: boolean[];
  _bounds: { boxInitialized: boolean; box: Box3; sphereInitialized: boolean; sphere: Sphere }[];
  _maxVertexCount: number;
  _maxIndexCount: number;
  _geometryInitialized: boolean;
  _geometryCount: number;
  _multiDrawCounts: Int32Array;
  _multiDrawStarts: Int32Array;
  _multiDrawCount: number;
  _visibilityChanged: boolean;
  _matricesTexture: DataTexture;
  _maxGeometryCount: number;

  static is(object: any): object is BatchedMesh {
    return object?.isBatchedMesh === true;
  }
  get maxGeometryCount() {
    return this._maxGeometryCount;
  }

  constructor(maxGeometryCount: number, material: Material, maxVertexCount: number, maxIndexCount: number) {
    super(new BufferGeometry(), material);

    this.isBatchedMesh = true;
    this.perObjectFrustumCulled = true;
    this.sortObjects = true;
    this.boundingBox = null;
    this.boundingSphere = null;
    this.customSort = null;

    this._drawRanges = [];
    this._reservedRanges = [];

    this._visibility = [];
    this._active = [];
    this._bounds = [];

    this._maxGeometryCount = maxGeometryCount;
    this._maxVertexCount = maxVertexCount;
    this._maxIndexCount = maxIndexCount;

    this._geometryInitialized = false;
    this._geometryCount = 0;
    this._multiDrawCounts = new Int32Array(maxGeometryCount);
    this._multiDrawStarts = new Int32Array(maxGeometryCount);
    this._multiDrawCount = 0;
    this._visibilityChanged = true;

    // Local matrix per geometry by using data texture
    this._matricesTexture = null!;

    this._initMatricesTexture();
  }

  _initMatricesTexture() {
    // layout (1 matrix = 4 pixels)
    //      RGBA RGBA RGBA RGBA (=> column1, column2, column3, column4)
    //  with  8x8  pixel texture max   16 matrices * 4 pixels =  (8 * 8)
    //       16x16 pixel texture max   64 matrices * 4 pixels = (16 * 16)
    //       32x32 pixel texture max  256 matrices * 4 pixels = (32 * 32)
    //       64x64 pixel texture max 1024 matrices * 4 pixels = (64 * 64)

    let size = Math.sqrt(this._maxGeometryCount * 4); // 4 pixels needed for 1 matrix
    size = Math.ceil(size / 4) * 4;
    size = Math.max(size, 4);

    const matricesArray = new Float32Array(size * size * 4); // 4 floats per RGBA pixel
    this._matricesTexture = new DataTexture(matricesArray, size, size, {
      format: TextureFormat.RGBA,
      type: TextureDataType.Float,
    });
  }

  _initializeGeometry(reference: BufferGeometry) {
    const geometry = this.geometry;
    const maxVertexCount = this._maxVertexCount;
    const maxGeometryCount = this._maxGeometryCount;
    const maxIndexCount = this._maxIndexCount;
    if (this._geometryInitialized === false) {
      for (const attributeName in reference.attributes) {
        const srcAttribute = reference.getAttribute(attributeName);
        const { array, itemSize, normalized } = srcAttribute;

        const dstArray = new array.constructor(maxVertexCount * itemSize);
        //@ts-expect-error
        const dstAttribute = new srcAttribute.constructor(dstArray, itemSize, normalized);
        //@ts-expect-error
        dstAttribute.setUsage(srcAttribute.usage);

        geometry.setAttribute(attributeName, dstAttribute);
      }

      if (reference.getIndex() !== null) {
        const indexArray = maxVertexCount > 65536 ? new Uint32Array(maxIndexCount) : new Uint16Array(maxIndexCount);

        geometry.setIndex(new BufferAttribute(indexArray, 1));
      }

      const idArray = maxGeometryCount > 65536 ? new Uint32Array(maxVertexCount) : new Uint16Array(maxVertexCount);
      geometry.setAttribute(ID_ATTR_NAME, new BufferAttribute(idArray, 1));

      this._geometryInitialized = true;
    }
  }

  // Make sure the geometry is compatible with the existing combined geometry atributes
  _validateGeometry(geometry: BufferGeometry) {
    // check that the geometry doesn't have a version of our reserved id attribute
    if (geometry.getAttribute(ID_ATTR_NAME)) {
      throw new Error(`BatchedMesh: Geometry cannot use attribute "${ID_ATTR_NAME}"`);
    }

    // check to ensure the geometries are using consistent attributes and indices
    const batchGeometry = this.geometry;
    if (Boolean(geometry.getIndex()) !== Boolean(batchGeometry.getIndex())) {
      throw new Error('BatchedMesh: All geometries must consistently have "index".');
    }

    for (const attributeName in batchGeometry.attributes) {
      if (attributeName === ID_ATTR_NAME) {
        continue;
      }

      if (!geometry.hasAttribute(attributeName)) {
        throw new Error(
          `BatchedMesh: Added geometry missing "${attributeName}". All geometries must have consistent attributes.`,
        );
      }

      const srcAttribute = geometry.getAttribute(attributeName);
      const dstAttribute = batchGeometry.getAttribute(attributeName);
      if (srcAttribute.itemSize !== dstAttribute.itemSize || srcAttribute.normalized !== dstAttribute.normalized) {
        throw new Error('BatchedMesh: All attributes must have a consistent itemSize and normalized value.');
      }
    }
  }

  setCustomSort(func: ((list: { start: number; count: number; z: number }[], camera: Camera) => void) | null): this {
    this.customSort = func;
    return this;
  }

  computeBoundingBox() {
    if (this.boundingBox === null) {
      this.boundingBox = new Box3();
    }

    const geometryCount = this._geometryCount;
    const boundingBox = this.boundingBox;
    const active = this._active;

    boundingBox.clear();
    for (let i = 0; i < geometryCount; i++) {
      if (active[i] === false) continue;

      this.getMatrixAt(i, _matrix);
      this.getBoundingBoxAt(i, _box)!.applyMat4(_matrix);
      boundingBox.union(_box);
    }
  }

  computeBoundingSphere() {
    if (this.boundingSphere === null) {
      this.boundingSphere = new Sphere();
    }

    const geometryCount = this._geometryCount;
    const boundingSphere = this.boundingSphere;
    const active = this._active;

    boundingSphere.clear();
    for (let i = 0; i < geometryCount; i++) {
      if (active[i] === false) continue;

      this.getMatrixAt(i, _matrix);
      this.getBoundingSphereAt(i, _sphere)!.applyMat4(_matrix);
      boundingSphere.union(_sphere);
    }
  }

  addGeometry(geometry: BufferGeometry, vertexCount: number = -1, indexCount: number = -1): number {
    this._initializeGeometry(geometry);

    this._validateGeometry(geometry);

    // ensure we're not over geometry
    if (this._geometryCount >= this._maxGeometryCount) {
      throw new Error('BatchedMesh: Maximum geometry count reached.');
    }

    // get the necessary range fo the geometry
    const reservedRange = {
      vertexStart: -1,
      vertexCount: -1,
      indexStart: -1,
      indexCount: -1,
    };

    let lastRange = null;
    const reservedRanges = this._reservedRanges;
    const drawRanges = this._drawRanges;
    const bounds = this._bounds;
    if (this._geometryCount !== 0) {
      lastRange = reservedRanges[reservedRanges.length - 1];
    }

    if (vertexCount === -1) {
      reservedRange.vertexCount = geometry.attributes.position.count;
    } else {
      reservedRange.vertexCount = vertexCount;
    }

    if (lastRange === null) {
      reservedRange.vertexStart = 0;
    } else {
      reservedRange.vertexStart = lastRange.vertexStart + lastRange.vertexCount;
    }

    const index = geometry.getIndex();
    const hasIndex = index !== null;
    if (hasIndex) {
      if (indexCount === -1) {
        reservedRange.indexCount = index.count;
      } else {
        reservedRange.indexCount = indexCount;
      }

      if (lastRange === null) {
        reservedRange.indexStart = 0;
      } else {
        reservedRange.indexStart = lastRange.indexStart + lastRange.indexCount;
      }
    }

    if (
      (reservedRange.indexStart !== -1 && reservedRange.indexStart + reservedRange.indexCount > this._maxIndexCount) ||
      reservedRange.vertexStart + reservedRange.vertexCount > this._maxVertexCount
    ) {
      throw new Error('BatchedMesh: Reserved space request exceeds the maximum buffer size.');
    }

    const visibility = this._visibility;
    const active = this._active;
    const matricesTexture = this._matricesTexture;
    const matricesArray = this._matricesTexture.image.data;

    // push new visibility states
    visibility.push(true);
    active.push(true);

    // update id
    const geometryId = this._geometryCount;
    this._geometryCount++;

    // initialize matrix information
    _identityMatrix.intoArray(matricesArray, geometryId * 16);
    matricesTexture.needsUpdate = true;

    // add the reserved range and draw range objects
    reservedRanges.push(reservedRange);
    drawRanges.push({
      start: hasIndex ? reservedRange.indexStart : reservedRange.vertexStart,
      count: -1,
    });
    bounds.push({
      boxInitialized: false,
      box: new Box3(),

      sphereInitialized: false,
      sphere: new Sphere(),
    });

    // set the id for the geometry
    const idAttribute = this.geometry.getAttribute(ID_ATTR_NAME);
    for (let i = 0; i < reservedRange.vertexCount; i++) {
      idAttribute.setX(reservedRange.vertexStart + i, geometryId);
    }

    idAttribute.needsUpdate = true;

    // update the geometry
    this.setGeometryAt(geometryId, geometry);

    return geometryId;
  }

  setGeometryAt(id: number, geometry: BufferGeometry): number {
    if (id >= this._geometryCount) {
      throw new Error('BatchedMesh: Maximum geometry count reached.');
    }

    this._validateGeometry(geometry);

    const batchGeometry = this.geometry;
    const hasIndex = batchGeometry.getIndex() !== null;
    const dstIndex = batchGeometry.getIndex();
    const srcIndex = geometry.getIndex()!;
    const reservedRange = this._reservedRanges[id];
    if (
      (hasIndex && srcIndex.count > reservedRange.indexCount) ||
      geometry.attributes.position.count > reservedRange.vertexCount
    ) {
      throw new Error('BatchedMesh: Reserved space not large enough for provided geometry.');
    }

    // copy geometry over
    const vertexStart = reservedRange.vertexStart;
    const vertexCount = reservedRange.vertexCount;
    for (const attributeName in batchGeometry.attributes) {
      if (attributeName === ID_ATTR_NAME) {
        continue;
      }

      // copy attribute data
      const srcAttribute = geometry.getAttribute(attributeName);
      const dstAttribute = batchGeometry.getAttribute(attributeName);
      //@ts-expect-error
      copyAttributeData(srcAttribute, dstAttribute, vertexStart);

      // fill the rest in with zeroes
      const itemSize = srcAttribute.itemSize;
      for (let i = srcAttribute.count, l = vertexCount; i < l; i++) {
        const index = vertexStart + i;
        for (let c = 0; c < itemSize; c++) {
          dstAttribute.setComponent(index, c, 0);
        }
      }

      dstAttribute.needsUpdate = true;
    }

    // copy index
    if (hasIndex) {
      const indexStart = reservedRange.indexStart;

      // copy index data over
      for (let i = 0; i < srcIndex.count; i++) {
        dstIndex!.setX(indexStart + i, vertexStart + srcIndex.getX(i));
      }

      // fill the rest in with zeroes
      for (let i = srcIndex.count, l = reservedRange.indexCount; i < l; i++) {
        dstIndex!.setX(indexStart + i, vertexStart);
      }

      dstIndex!.needsUpdate = true;
    }

    // store the bounding boxes
    const bound = this._bounds[id];
    if (geometry.boundingBox !== null) {
      bound.box.from(geometry.boundingBox);
      bound.boxInitialized = true;
    } else {
      bound.boxInitialized = false;
    }

    if (geometry.boundingSphere !== null) {
      geometry.boundingSphere.from(bound.sphere);
      bound.sphereInitialized = true;
    } else {
      bound.sphereInitialized = false;
    }

    // set drawRange count
    const drawRange = this._drawRanges[id];
    const posAttr = geometry.attributes.position;
    drawRange.count = hasIndex ? srcIndex.count : posAttr.count;
    this._visibilityChanged = true;

    return id;
  }

  deleteGeometry(geometryId: number) {
    // Note: User needs to call optimize() afterward to pack the data.

    const active = this._active;
    if (geometryId >= active.length || active[geometryId] === false) {
      return this;
    }

    active[geometryId] = false;
    this._visibilityChanged = true;

    return this;
  }

  // get bounding box and compute it if it doesn't exist
  getBoundingBoxAt(id: number, target: Box3): Box3 | null {
    const active = this._active;
    if (active[id] === false) {
      return null;
    }

    // compute bounding box
    const bound = this._bounds[id];
    const box = bound.box;
    const geometry = this.geometry;
    if (bound.boxInitialized === false) {
      box.clear();

      const index = geometry.index;
      const position = geometry.attributes.position;
      const drawRange = this._drawRanges[id];
      for (let i = drawRange.start, l = drawRange.start + drawRange.count; i < l; i++) {
        let iv = i;
        if (index) {
          iv = index.getX(iv);
        }

        box.expandCoord(_vector.fromAttribute(position, iv));
      }

      bound.boxInitialized = true;
    }

    target.from(box);
    return target;
  }

  // get bounding sphere and compute it if it doesn't exist
  getBoundingSphereAt(id: number, into: Sphere): Sphere | null {
    const active = this._active;
    if (active[id] === false) {
      return null;
    }

    // compute bounding sphere
    const bound = this._bounds[id];
    const sphere = bound.sphere;
    const geometry = this.geometry;
    if (bound.sphereInitialized === false) {
      sphere.clear();

      this.getBoundingBoxAt(id, _box);
      _box.center(sphere.center);

      const index = geometry.index;
      const position = geometry.attributes.position;
      const drawRange = this._drawRanges[id];

      let maxRadiusSq = 0;
      for (let i = drawRange.start, l = drawRange.start + drawRange.count; i < l; i++) {
        let iv = i;
        if (index) {
          iv = index.getX(iv);
        }

        _vector.fromAttribute(position, iv);
        maxRadiusSq = Math.max(maxRadiusSq, sphere.center.distanceSqTo(_vector));
      }

      sphere.radius = Math.sqrt(maxRadiusSq);
      bound.sphereInitialized = true;
    }

    return into.from(sphere);
  }

  setMatrixAt(geometryId: number, matrix: Mat4): this {
    // @TODO: Map geometryId to index of the arrays because
    //        optimize() can make geometryId mismatch the index

    const active = this._active;
    const matricesTexture = this._matricesTexture;
    const matricesArray = this._matricesTexture.image.data;
    const geometryCount = this._geometryCount;
    if (geometryId >= geometryCount || active[geometryId] === false) {
      return this;
    }

    matrix.intoArray(matricesArray, geometryId * 16);
    matricesTexture.needsUpdate = true;

    return this;
  }

  getMatrixAt(geometryId: number, matrix: Mat4): Mat4 | null {
    const active = this._active;
    const matricesArray = this._matricesTexture.image.data;
    const geometryCount = this._geometryCount;
    if (geometryId >= geometryCount || active[geometryId] === false) {
      return null;
    }

    return matrix.fromArray(matricesArray, geometryId * 16);
  }

  setVisibleAt(geometryId: number, value: boolean): this {
    const visibility = this._visibility;
    const active = this._active;
    const geometryCount = this._geometryCount;

    // if the geometry is out of range, not active, or visibility state
    // does not change then return early
    if (geometryId >= geometryCount || active[geometryId] === false || visibility[geometryId] === value) {
      return this;
    }

    visibility[geometryId] = value;
    this._visibilityChanged = true;

    return this;
  }

  getVisibleAt(geometryId: number): boolean {
    const visibility = this._visibility;
    const active = this._active;
    const geometryCount = this._geometryCount;

    // return early if the geometry is out of range or not active
    if (geometryId >= geometryCount || active[geometryId] === false) {
      return false;
    }

    return visibility[geometryId];
  }

  raycast(raycaster: Raycaster, intersects: Intersection[]): void {
    const visibility = this._visibility;
    const active = this._active;
    const drawRanges = this._drawRanges;
    const geometryCount = this._geometryCount;
    const matrixWorld = this.matrixWorld;
    const batchGeometry = this.geometry;

    // iterate over each geometry
    _mesh.material = this.material;
    _mesh.geometry.index = batchGeometry.index;
    _mesh.geometry.attributes = batchGeometry.attributes;
    if (_mesh.geometry.boundingBox === null) {
      _mesh.geometry.boundingBox = new Box3();
    }

    if (_mesh.geometry.boundingSphere === null) {
      _mesh.geometry.boundingSphere = new Sphere();
    }

    for (let i = 0; i < geometryCount; i++) {
      if (!visibility[i] || !active[i]) {
        continue;
      }

      const drawRange = drawRanges[i];
      _mesh.geometry.setDrawRange(drawRange.start, drawRange.count);

      // ge the intersects
      this.getMatrixAt(i, _mesh.matrixWorld)!.premul(matrixWorld);
      this.getBoundingBoxAt(i, _mesh.geometry.boundingBox);
      this.getBoundingSphereAt(i, _mesh.geometry.boundingSphere);
      _mesh.raycast(raycaster, _batchIntersects);

      // add batch id to the intersects
      for (let j = 0, l = _batchIntersects.length; j < l; j++) {
        const intersect = _batchIntersects[j];
        intersect.object = this;
        intersect.batchId = i;
        intersects.push(intersect);
      }

      _batchIntersects.length = 0;
    }

    _mesh.material = null!;
    _mesh.geometry.index = null;
    _mesh.geometry.attributes = {};
    _mesh.geometry.setDrawRange(0, Infinity);
  }

  copy(source: this, recursive?: boolean): this {
    super.copy(source, recursive);

    this.geometry = source.geometry.clone();
    this.perObjectFrustumCulled = source.perObjectFrustumCulled;
    this.sortObjects = source.sortObjects;
    this.boundingBox = source.boundingBox !== null ? source.boundingBox.clone() : null;
    this.boundingSphere = source.boundingSphere !== null ? source.boundingSphere.clone() : null;

    this._drawRanges = source._drawRanges.map(range => ({ ...range }));
    this._reservedRanges = source._reservedRanges.map(range => ({ ...range }));

    this._visibility = source._visibility.slice();
    this._active = source._active.slice();
    this._bounds = source._bounds.map(bound => ({
      boxInitialized: bound.boxInitialized,
      box: bound.box.clone(),

      sphereInitialized: bound.sphereInitialized,
      sphere: bound.sphere.clone(),
    }));

    this._maxGeometryCount = source._maxGeometryCount;
    this._maxVertexCount = source._maxVertexCount;
    this._maxIndexCount = source._maxIndexCount;

    this._geometryInitialized = source._geometryInitialized;
    this._geometryCount = source._geometryCount;
    this._multiDrawCounts = source._multiDrawCounts.slice();
    this._multiDrawStarts = source._multiDrawStarts.slice();

    this._matricesTexture = source._matricesTexture.clone() as DataTexture;
    this._matricesTexture.image.data = this._matricesTexture.image.slice();

    return this;
  }

  dispose() {
    // Assuming the geometry is not shared with other meshes
    this.geometry.dispose();

    this._matricesTexture.dispose();
    this._matricesTexture = null!;
    return this;
  }

  onBeforeRender(
    renderer: Renderer,
    scene: Scene,
    camera: Camera,
    geometry: BufferGeometry,
    material: Material,
    group: Group,
  ) {
    // if visibility has not changed and frustum culling and object sorting is not required
    // then skip iterating over all items
    if (!this._visibilityChanged && !this.perObjectFrustumCulled && !this.sortObjects) {
      return;
    }

    // the indexed version of the multi draw function requires specifying the start
    // offset in bytes.
    const index = geometry.getIndex();
    const bytesPerElement = index === null ? 1 : index.array.BYTES_PER_ELEMENT;

    const active = this._active;
    const visibility = this._visibility;
    const multiDrawStarts = this._multiDrawStarts;
    const multiDrawCounts = this._multiDrawCounts;
    const drawRanges = this._drawRanges;
    const perObjectFrustumCulled = this.perObjectFrustumCulled;

    // prepare the frustum in the local frame
    if (perObjectFrustumCulled) {
      _projScreenMatrix.from(camera.projectionMatrix).mul(camera.matrixWorldInverse).mul(this.matrixWorld);
      _frustum.fromProjection(_projScreenMatrix);
    }

    let count = 0;
    if (this.sortObjects) {
      // get the camera position in the local frame
      _invMatrixWorld.from(this.matrixWorld).invert();
      _vector.fromMat4Position(camera.matrixWorld).applyMat4(_invMatrixWorld);

      for (let i = 0, l = visibility.length; i < l; i++) {
        if (visibility[i] && active[i]) {
          // get the bounds in world space
          this.getMatrixAt(i, _matrix);
          this.getBoundingSphereAt(i, _sphere)!.applyMat4(_matrix);

          // determine whether the batched geometry is within the frustum
          let culled = false;
          if (perObjectFrustumCulled) {
            culled = !_frustum.intersectsSphere(_sphere);
          }

          if (!culled) {
            // get the distance from camera used for sorting
            const z = _vector.distanceTo(_sphere.center);
            _renderList.push(drawRanges[i], z);
          }
        }
      }

      // Sort the draw ranges and prep for rendering
      const list = _renderList.list;
      const customSort = this.customSort;
      if (customSort === null) {
        list.sort(material.transparent ? sortDesc : sortAsc);
      } else {
        customSort.call(this, list, camera);
      }

      for (let i = 0, l = list.length; i < l; i++) {
        const item = list[i];
        multiDrawStarts[count] = item.start * bytesPerElement;
        multiDrawCounts[count] = item.count;
        count++;
      }

      _renderList.reset();
    } else {
      for (let i = 0, l = visibility.length; i < l; i++) {
        if (visibility[i] && active[i]) {
          // determine whether the batched geometry is within the frustum
          let culled = false;
          if (perObjectFrustumCulled) {
            // get the bounds in world space
            this.getMatrixAt(i, _matrix);
            this.getBoundingSphereAt(i, _sphere)!.applyMat4(_matrix);
            culled = !_frustum.intersectsSphere(_sphere);
          }

          if (!culled) {
            const range = drawRanges[i];
            multiDrawStarts[count] = range.start * bytesPerElement;
            multiDrawCounts[count] = range.count;
            count++;
          }
        }
      }
    }

    this._multiDrawCount = count;
    this._visibilityChanged = false;
  }

  onBeforeShadow(
    renderer: Renderer,
    scene: Scene,
    shadowCamera: Camera,
    geometry: BufferGeometry,
    depthMaterial: Material,
    group: Group,
  ) {
    this.onBeforeRender(renderer, scene, shadowCamera, geometry, depthMaterial, group);
  }
}
