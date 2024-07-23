import { PropertyBinding } from './PropertyBinding.js';
import { Entity } from '@modules/renderer/engine/core/Entity.js';
import { v4 } from 'uuid';

export class AnimationObjectGroup {
  declare isAnimationObjectGroup: true;
  uuid: string;
  _objects: any[];
  nCachedObjects_: number;
  _indicesByUuid: { [key: string]: number };
  _paths: string[];
  _parsedPaths: any[];
  _bindings: PropertyBinding[][];
  _bindingsIndicesByPath: Record<string, number>;
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

    // cached objects followed by the active ones
    this.objects = bindings;

    this.nCachedObjects_ = 0;

    const indices: Record<string, number> = {};
    this._indicesByUuid = indices;

    for (let i = 0, n = bindings.length; i !== n; ++i) {
      indices[bindings[i].uuid] = i;
    }

    this._paths = [];
    // inside: { we don't care, here }
    this._parsedPaths = [];
    this.bindings = [];
    // inside: indices in these arrays
    this.bindingsIndicesByPath = {};

    const scope = this;

    this.stats = {
      objects: {
        get total() {
          return scope.objects.length;
        },
        get inUse() {
          return this.total - scope.nCachedObjects_;
        },
      },
      get bindingsPerObject() {
        return scope.bindings.length;
      },
    };
  }

  add() {
    const objects = this.objects,
      indicesByUUID = this._indicesByUuid,
      paths = this._paths,
      parsedPaths = this._parsedPaths,
      bindings = this.bindings,
      nBindings = bindings.length;

    let knownObject = undefined,
      nObjects = objects.length,
      nCachedObjects = this.nCachedObjects_;

    for (let i = 0, n = arguments.length; i !== n; ++i) {
      const object = arguments[i],
        uuid = object.uuid;
      let index = indicesByUUID[uuid];

      if (index === undefined) {
        // unknown object -> add it to the ACTIVE region

        index = nObjects++;
        indicesByUUID[uuid] = index;
        objects.push(object);

        // accounting is done, now do the same for all bindings

        for (let j = 0, m = nBindings; j !== m; ++j) {
          bindings[j].push(new PropertyBinding(object, paths[j], parsedPaths[j]));
        }
      } else if (index < nCachedObjects) {
        knownObject = objects[index];

        // move existing object to the ACTIVE region

        const firstActiveIndex = --nCachedObjects,
          lastCachedObject = objects[firstActiveIndex];

        indicesByUUID[lastCachedObject.uuid] = index;
        objects[index] = lastCachedObject;

        indicesByUUID[uuid] = firstActiveIndex;
        objects[firstActiveIndex] = object;

        // accounting is done, now do the same for all bindings

        for (let j = 0, m = nBindings; j !== m; ++j) {
          const bindingsForPath = bindings[j],
            lastCached = bindingsForPath[firstActiveIndex];

          let binding = bindingsForPath[index];

          bindingsForPath[index] = lastCached;

          if (binding === undefined) {
            // since we do not bother to create new bindings
            // for objects that are cached, the binding may
            // or may not exist

            binding = new PropertyBinding(object, paths[j], parsedPaths[j]);
          }

          bindingsForPath[firstActiveIndex] = binding;
        }
      } else if (objects[index] !== knownObject) {
        console.error(
          'engine.AnimationObjectGroup: Different objects with the same UUID ' +
            'detected. Clean the caches or recreate your infrastructure when reloading scenes.',
        );
      } // else the object is already where we want it to be
    } // for arguments

    this.nCachedObjects_ = nCachedObjects;
  }

  remove() {
    const objects = this.objects,
      indicesByUUID = this._indicesByUuid,
      bindings = this.bindings,
      nBindings = bindings.length;

    let nCachedObjects = this.nCachedObjects_;

    for (let i = 0, n = arguments.length; i !== n; ++i) {
      const object = arguments[i],
        uuid = object.uuid,
        index = indicesByUUID[uuid];

      if (index !== undefined && index >= nCachedObjects) {
        // move existing object into the CACHED region

        const lastCachedIndex = nCachedObjects++,
          firstActiveObject = objects[lastCachedIndex];

        indicesByUUID[firstActiveObject.uuid] = index;
        objects[index] = firstActiveObject;

        indicesByUUID[uuid] = lastCachedIndex;
        objects[lastCachedIndex] = object;

        // accounting is done, now do the same for all bindings

        for (let j = 0, m = nBindings; j !== m; ++j) {
          const bindingsForPath = bindings[j],
            firstActive = bindingsForPath[lastCachedIndex],
            binding = bindingsForPath[index];

          bindingsForPath[index] = firstActive;
          bindingsForPath[lastCachedIndex] = binding;
        }
      }
    } // for arguments

    this.nCachedObjects_ = nCachedObjects;
  }

  // remove & forget
  uncache() {
    const objects = this.objects,
      indicesByUUID = this._indicesByUuid,
      bindings = this.bindings,
      nBindings = bindings.length;

    let nCachedObjects = this.nCachedObjects_,
      nObjects = objects.length;

    for (let i = 0, n = arguments.length; i !== n; ++i) {
      const object = arguments[i],
        uuid = object.uuid,
        index = indicesByUUID[uuid];

      if (index !== undefined) {
        delete indicesByUUID[uuid];

        if (index < nCachedObjects) {
          // object is cached, shrink the CACHED region

          const firstActiveIndex = --nCachedObjects,
            lastCachedObject = objects[firstActiveIndex],
            lastIndex = --nObjects,
            lastObject = objects[lastIndex];

          // last cached object takes this object's place
          indicesByUUID[lastCachedObject.uuid] = index;
          objects[index] = lastCachedObject;

          // last object goes to the activated slot and pop
          indicesByUUID[lastObject.uuid] = firstActiveIndex;
          objects[firstActiveIndex] = lastObject;
          objects.pop();

          // accounting is done, now do the same for all bindings

          for (let j = 0, m = nBindings; j !== m; ++j) {
            const bindingsForPath = bindings[j],
              lastCached = bindingsForPath[firstActiveIndex],
              last = bindingsForPath[lastIndex];

            bindingsForPath[index] = lastCached;
            bindingsForPath[firstActiveIndex] = last;
            bindingsForPath.pop();
          }
        } else {
          // object is active, just swap with the last and pop

          const lastIndex = --nObjects,
            lastObject = objects[lastIndex];

          if (lastIndex > 0) {
            indicesByUUID[lastObject.uuid] = index;
          }

          objects[index] = lastObject;
          objects.pop();

          // accounting is done, now do the same for all bindings

          for (let j = 0, m = nBindings; j !== m; ++j) {
            const bindingsForPath = bindings[j];

            bindingsForPath[index] = bindingsForPath[lastIndex];
            bindingsForPath.pop();
          }
        } // cached or active
      } // if object is known
    } // for arguments

    this.nCachedObjects_ = nCachedObjects;
  }

  // Internal interface used by befriended PropertyBinding.Composite:

  subscribe_(path: string, parsedPath: any) {
    // returns an array of bindings for the given path that is changed
    // according to the contained objects in the group

    const indicesByPath = this.bindingsIndicesByPath;
    let index = indicesByPath[path];
    const bindings = this.bindings;

    if (index !== undefined) return bindings[index];

    const paths = this._paths,
      parsedPaths = this._parsedPaths,
      objects = this.objects,
      nObjects = objects.length,
      nCachedObjects = this.nCachedObjects_,
      bindingsForPath = new Array(nObjects);

    index = bindings.length;

    indicesByPath[path] = index;

    paths.push(path);
    parsedPaths.push(parsedPath);
    bindings.push(bindingsForPath);

    for (let i = nCachedObjects, n = objects.length; i !== n; ++i) {
      const object = objects[i];
      bindingsForPath[i] = new PropertyBinding(object, path, parsedPath);
    }

    return bindingsForPath;
  }

  unsubscribe_(path: string) {
    // tells the group to forget about a property path and no longer
    // update the array previously obtained with 'subscribe_'

    const indicesByPath = this.bindingsIndicesByPath,
      index = indicesByPath[path];

    if (index !== undefined) {
      const paths = this._paths,
        parsedPaths = this._parsedPaths,
        bindings = this.bindings,
        lastBindingsIndex = bindings.length - 1,
        lastBindings = bindings[lastBindingsIndex],
        lastBindingsPath = path[lastBindingsIndex];

      indicesByPath[lastBindingsPath] = index;

      bindings[index] = lastBindings;
      bindings.pop();

      parsedPaths[index] = parsedPaths[lastBindingsIndex];
      parsedPaths.pop();

      paths[index] = paths[lastBindingsIndex];
      paths.pop();
    }
  }
}
