import { PropertyBinding } from './PropertyBinding.js';
import { Entity } from '@modules/renderer/engine/core/Entity.js';
import { v4 } from 'uuid';

export class AnimationObjectGroup {
  declare isAnimationObjectGroup: true;
  uuid: string;
  objects: Entity[];
  cacheSize: number;
  indexByUuid: Record<string, number>;
  paths: string[];
  bindings: PropertyBinding[][];
  bindingsIndicesByPath: Record<string, number>;
  stats: {
    objects: {
      total: number;
      inUse: number;
    };
    bindingsPerObject: number;
  };

  constructor(...bindings: Entity[]) {
    this.isAnimationObjectGroup = true;

    this.uuid = v4();
    this.objects = bindings;

    this.cacheSize = 0;

    const indices: Record<string, number> = {};
    this.indexByUuid = indices;

    for (let i = 0, n = bindings.length; i !== n; ++i) {
      indices[bindings[i].uuid] = i;
    }

    this.paths = [];
    this.bindings = [];
    this.bindingsIndicesByPath = {};

    const scope = this;

    this.stats = {
      objects: {
        get total() {
          return scope.objects.length;
        },
        get inUse() {
          return this.total - scope.cacheSize;
        },
      },
      get bindingsPerObject() {
        return scope.bindings.length;
      },
    };
  }

  static is(item: any): item is AnimationObjectGroup {
    return item?.isAnimationObjectGroup === true;
  }

  add() {
    const objects = this.objects,
      indicesByUUID = this.indexByUuid,
      paths = this.paths,
      bindings = this.bindings,
      nBindings = bindings.length;

    let knownObject = undefined,
      nObjects = objects.length,
      nCachedObjects = this.cacheSize;

    for (let i = 0, n = arguments.length; i !== n; ++i) {
      const object = arguments[i],
        uuid = object.uuid;
      let index = indicesByUUID[uuid];

      if (index === undefined) {
        index = nObjects++;
        indicesByUUID[uuid] = index;
        objects.push(object);

        for (let j = 0, m = nBindings; j !== m; ++j) {
          bindings[j].push(new PropertyBinding(object, paths[j]));
        }
      } else if (index < nCachedObjects) {
        knownObject = objects[index];

        const firstActiveIndex = --nCachedObjects,
          lastCachedObject = objects[firstActiveIndex];

        indicesByUUID[lastCachedObject.uuid] = index;
        objects[index] = lastCachedObject;

        indicesByUUID[uuid] = firstActiveIndex;
        objects[firstActiveIndex] = object;

        for (let j = 0, m = nBindings; j !== m; ++j) {
          const bindingsForPath = bindings[j],
            lastCached = bindingsForPath[firstActiveIndex];

          let binding = bindingsForPath[index];

          bindingsForPath[index] = lastCached;

          if (binding === undefined) {
            binding = new PropertyBinding(object, paths[j]);
          }

          bindingsForPath[firstActiveIndex] = binding;
        }
      } else if (objects[index] !== knownObject) {
        console.error(
          'engine.AnimationObjectGroup: Different objects with the same UUID ' +
            'detected. Clean the caches or recreate your infrastructure when reloading scenes.',
        );
      }
    }

    this.cacheSize = nCachedObjects;
  }

  remove() {
    const objects = this.objects,
      indicesByUUID = this.indexByUuid,
      bindings = this.bindings,
      nBindings = bindings.length;

    let nCachedObjects = this.cacheSize;

    for (let i = 0, n = arguments.length; i !== n; ++i) {
      const object = arguments[i],
        uuid = object.uuid,
        index = indicesByUUID[uuid];

      if (index !== undefined && index >= nCachedObjects) {
        const lastCachedIndex = nCachedObjects++,
          firstActiveObject = objects[lastCachedIndex];

        indicesByUUID[firstActiveObject.uuid] = index;
        objects[index] = firstActiveObject;

        indicesByUUID[uuid] = lastCachedIndex;
        objects[lastCachedIndex] = object;

        for (let j = 0, m = nBindings; j !== m; ++j) {
          const bindingsForPath = bindings[j],
            firstActive = bindingsForPath[lastCachedIndex],
            binding = bindingsForPath[index];

          bindingsForPath[index] = firstActive;
          bindingsForPath[lastCachedIndex] = binding;
        }
      }
    }

    this.cacheSize = nCachedObjects;
  }

  subscribe(path: string) {
    const indicesByPath = this.bindingsIndicesByPath;
    let index = indicesByPath[path];
    const bindings = this.bindings;

    if (index !== undefined) return bindings[index];

    const paths = this.paths,
      objects = this.objects,
      nObjects = objects.length,
      nCachedObjects = this.cacheSize,
      binds = new Array(nObjects);

    index = bindings.length;

    indicesByPath[path] = index;

    paths.push(path);
    bindings.push(binds);

    for (let i = nCachedObjects, n = objects.length; i !== n; ++i) {
      const object = objects[i];
      binds[i] = new PropertyBinding(object, path);
    }

    return binds;
  }

  unsubscribe(path: string) {
    const indicesByPath = this.bindingsIndicesByPath;
    const index = indicesByPath[path];

    if (index !== undefined) {
      const paths = this.paths,
        bindings = this.bindings,
        lastBindingsIndex = bindings.length - 1,
        lastBindings = bindings[lastBindingsIndex],
        lastBindingsPath = path[lastBindingsIndex];

      indicesByPath[lastBindingsPath] = index;

      bindings[index] = lastBindings;
      bindings.pop();

      paths[index] = paths[lastBindingsIndex];
      paths.pop();
    }
  }
}
