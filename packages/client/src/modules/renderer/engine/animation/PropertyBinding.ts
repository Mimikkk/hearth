import { AnimationObjectGroup } from '@modules/renderer/engine/animation/AnimationObjectGroup.js';
import { Entity } from '@modules/renderer/engine/core/Entity.js';
import { NumberArray } from '@modules/renderer/engine/math/MathUtils.js';

interface ParsedPath {
  nodeName: string;
  objectName: string;
  objectIndex: string;
  propertyName: string;
  propertyIndex: string;
}

export interface IPropertyBinding {
  getValue: (buffer: NumberArray, offset: number) => void;
  setValue: (buffer: NumberArray, offset: number) => void;
  parsedPath: ParsedPath;
}

export class PropertyBinding implements IPropertyBinding {
  getValue: (buffer: NumberArray, offset: number) => void;
  setValue: (buffer: NumberArray, offset: number) => void;
  parsedPath: ParsedPath;
  node: Entity;
  targetObject: Entity;
  propertyName: string;
  propertyIndex: string;
  resolvedProperty: any;

  constructor(
    public rootNode: Entity,
    public path: string,
  ) {
    this.parsedPath = PropertyBinding.parse(path);
    this.node = PropertyBinding.find(rootNode, this.parsedPath.nodeName);
    this.getValue = this.#getValue_unbound;
    this.setValue = this.#setValue_unbound;
  }

  static new(root: Entity, path: string) {
    return AnimationObjectGroup.is(root) ? new PropertyBindingGroup(root, path) : new PropertyBinding(root, path);
  }

  static sanitize(name: string) {
    return name.replace(/\s/g, '_').replace(ReservedRe, '');
  }

  static parse(trackName: string) {
    const match = TrackRe.exec(trackName);
    if (match === null) throw new Error('PropertyBinding: Cannot parse trackName: ' + trackName);

    if (!match[5]?.length) {
      throw new Error('PropertyBinding: can not parse propertyName from trackName: ' + trackName);
    }

    const results = {
      directoryName: match[1],
      nodeName: match[2],
      objectName: match[3],
      objectIndex: match[4],
      propertyName: match[5],
      propertyIndex: match[6],
    };

    const lastDot = results.nodeName?.lastIndexOf('.') ?? -1;
    if (lastDot > -1) {
      const name = results.nodeName.substring(lastDot + 1);

      if (ValidNames.includes(name)) {
        results.nodeName = results.nodeName.substring(0, lastDot);
        results.objectName = name;
      }
    }

    return results;
  }

  static find(root: Entity, name: string | -1): Entity | null {
    if (name === undefined || name === '' || name === '.' || name === -1 || name === root.name || name === root.uuid) {
      return root;
    }

    if (root.skeleton) {
      const bone = root.skeleton.getBoneByName(name);
      if (bone) return bone;
    }
    if (root.children) {
      const bone = findBoneByName(root.children, name);
      if (bone) return bone;
    }

    return null;
  }

  bind() {
    let object = this.node;
    const parsedPath = this.parsedPath;

    const name = parsedPath.objectName;
    const propertyName = parsedPath.propertyName;
    let propertyIndex = parsedPath.propertyIndex;

    this.getValue = this.#getValue_unavailable;
    this.setValue = this.#setValue_unavailable;

    if (name) {
      let index = parsedPath.objectIndex;

      switch (name) {
        case 'materials':
          object = object.material.materials;
          break;
        case 'bones':
          object = object.skeleton.bones;
          for (let i = 0; i < object.length; i++) {
            if (object[i].name === index) {
              index = i;
              break;
            }
          }

          break;
        case 'map':
          if ('map' in object) {
            object = object.map;
            break;
          }

          object = object.material.map;
          break;
        default:
          object = object[name];
      }

      if (index !== undefined) object = object[index];
    }
    const property = object[propertyName];

    let versioning = Version.None;
    this.targetObject = object;
    let bindingType = BindType.Direct;

    if (object.needsUpdate !== undefined) {
      versioning = Version.NeedsUpdate;
    } else if (object.matrixWorldNeedsUpdate !== undefined) {
      versioning = Version.MatrixWorldNeedsUpdate;
    }
    if (propertyIndex !== undefined) {
      if (propertyName === 'morphTargetInfluences') {
        if (object.morphTargetDictionary[propertyIndex]) {
          propertyIndex = object.morphTargetDictionary[propertyIndex];
        }
      }

      bindingType = BindType.ArrayElement;

      this.resolvedProperty = property;
      this.propertyIndex = propertyIndex;
    } else if (property.fromArray !== undefined && property.intoArray !== undefined) {
      bindingType = BindType.HasFromToArray;
      this.resolvedProperty = property;
    } else if (Array.isArray(property)) {
      bindingType = BindType.EntireArray;
      this.resolvedProperty = property;
    } else {
      this.propertyName = propertyName;
    }

    switch (bindingType) {
      case BindType.Direct:
        this.getValue = this.#getValue_direct;
        switch (versioning) {
          case Version.None:
            this.setValue = this.#setValue_direct;
            break;
          case Version.NeedsUpdate:
            this.setValue = this.#setValue_direct_setNeedsUpdate;
            break;
          case Version.MatrixWorldNeedsUpdate:
            this.setValue = this.#setValue_direct_setMatrixWorldNeedsUpdate;
            break;
        }
        break;
      case BindType.EntireArray:
        this.getValue = this.#getValue_array;
        switch (versioning) {
          case Version.None:
            this.setValue = this.#setValue_array;
            break;
          case Version.NeedsUpdate:
            this.setValue = this.#setValue_array_setNeedsUpdate;
            break;
          case Version.MatrixWorldNeedsUpdate:
            this.setValue = this.#setValue_array_setMatrixWorldNeedsUpdate;
            break;
        }
        break;
      case BindType.ArrayElement:
        this.getValue = this.#getValue_arrayElement;
        switch (versioning) {
          case Version.None:
            this.setValue = this.#setValue_arrayElement;
            break;
          case Version.NeedsUpdate:
            this.setValue = this.#setValue_arrayElement_setNeedsUpdate;
            break;
          case Version.MatrixWorldNeedsUpdate:
            this.setValue = this.#setValue_arrayElement_setMatrixWorldNeedsUpdate;
            break;
        }
        break;
      case BindType.HasFromToArray:
        this.getValue = this.#getValue_toArray;
        switch (versioning) {
          case Version.None:
            this.setValue = this.#setValue_fromArray;
            break;
          case Version.NeedsUpdate:
            this.setValue = this.#setValue_fromArray_setNeedsUpdate;
            break;
          case Version.MatrixWorldNeedsUpdate:
            this.setValue = this.#setValue_fromArray_setMatrixWorldNeedsUpdate;
            break;
        }
        break;
    }
  }

  unbind() {
    this.node = null!;
    this.getValue = this.#getValue_unbound;
    this.setValue = this.#setValue_unbound;
  }

  #getValue_unavailable() {}

  #setValue_unavailable() {}

  #getValue_direct(buffer: NumberArray, offset: number): void {
    buffer[offset] = this.targetObject[this.propertyName];
  }

  #getValue_array(buffer: NumberArray, offset: number): void {
    const source = this.resolvedProperty;

    for (let i = 0, n = source.length; i !== n; ++i) {
      buffer[offset++] = source[i];
    }
  }

  #getValue_arrayElement(buffer: NumberArray, offset: number): void {
    buffer[offset] = this.resolvedProperty[this.propertyIndex];
  }

  #getValue_toArray(buffer: NumberArray, offset: number): void {
    this.resolvedProperty.intoArray(buffer, offset);
  }

  #setValue_direct(buffer: NumberArray, offset: number): void {
    this.targetObject[this.propertyName] = buffer[offset];
  }

  #setValue_direct_setNeedsUpdate(buffer: NumberArray, offset: number): void {
    this.targetObject[this.propertyName] = buffer[offset];
    this.targetObject.needsUpdate = true;
  }

  #setValue_direct_setMatrixWorldNeedsUpdate(buffer: NumberArray, offset: number): void {
    this.targetObject[this.propertyName] = buffer[offset];
    this.targetObject.matrixWorldNeedsUpdate = true;
  }

  #setValue_array(buffer: NumberArray, offset: number): void {
    const dest = this.resolvedProperty;

    for (let i = 0, n = dest.length; i !== n; ++i) {
      dest[i] = buffer[offset++];
    }
  }

  #setValue_array_setNeedsUpdate(buffer: NumberArray, offset: number): void {
    const dest = this.resolvedProperty;

    for (let i = 0, n = dest.length; i !== n; ++i) {
      dest[i] = buffer[offset++];
    }

    this.targetObject.needsUpdate = true;
  }

  #setValue_array_setMatrixWorldNeedsUpdate(buffer: NumberArray, offset: number): void {
    const dest = this.resolvedProperty;

    for (let i = 0, n = dest.length; i !== n; ++i) {
      dest[i] = buffer[offset++];
    }

    this.targetObject.matrixWorldNeedsUpdate = true;
  }

  #setValue_arrayElement(buffer: NumberArray, offset: number): void {
    this.resolvedProperty[this.propertyIndex] = buffer[offset];
  }

  #setValue_arrayElement_setNeedsUpdate(buffer: NumberArray, offset: number): void {
    this.resolvedProperty[this.propertyIndex] = buffer[offset];
    this.targetObject.needsUpdate = true;
  }

  #setValue_arrayElement_setMatrixWorldNeedsUpdate(buffer: NumberArray, offset: number): void {
    this.resolvedProperty[this.propertyIndex] = buffer[offset];
    this.targetObject.matrixWorldNeedsUpdate = true;
  }

  #setValue_fromArray(buffer: NumberArray, offset: number): void {
    this.resolvedProperty.fromArray(buffer, offset);
  }

  #setValue_fromArray_setNeedsUpdate(buffer: NumberArray, offset: number): void {
    this.resolvedProperty.fromArray(buffer, offset);
    this.targetObject.needsUpdate = true;
  }

  #setValue_fromArray_setMatrixWorldNeedsUpdate(buffer: NumberArray, offset: number): void {
    this.resolvedProperty.fromArray(buffer, offset);
    this.targetObject.matrixWorldNeedsUpdate = true;
  }

  #getValue_unbound(targetArray: NumberArray, offset: number): void {
    this.bind();
    this.getValue(targetArray, offset);
  }

  #setValue_unbound(sourceArray: NumberArray, offset: number): void {
    this.bind();
    this.setValue(sourceArray, offset);
  }
}

export class PropertyBindingGroup implements IPropertyBinding {
  bindings: PropertyBinding[];
  parsedPath: ParsedPath;

  constructor(
    public group: AnimationObjectGroup,
    path: string,
  ) {
    this.bindings = group.subscribe(path, PropertyBinding.parse(path));
    this.parsedPath = this.bindings[0].parsedPath;
  }

  getValue(array: NumberArray, offset: number): void {
    this.bind();

    const firstValidIndex = this.group.cacheSize;
    const binding = this.bindings[firstValidIndex];

    if (binding) binding.getValue(array, offset);
  }

  setValue(array: NumberArray, offset: number): void {
    const bindings = this.bindings;

    for (let i = this.group.cacheSize, n = bindings.length; i !== n; ++i) {
      bindings[i].setValue(array, offset);
    }
  }

  bind(): void {
    const bindings = this.bindings;

    for (let i = this.group.cacheSize, n = bindings.length; i !== n; ++i) {
      bindings[i].bind();
    }
  }

  unbind(): void {
    const bindings = this.bindings;
    for (let i = this.group.cacheSize, n = bindings.length; i !== n; ++i) {
      bindings[i].unbind();
    }
  }
}

const findBoneByName = (children: Entity[], name: string): Entity | null => {
  for (let i = 0; i < children.length; ++i) {
    const child = children[i];

    if (child.name === name || child.uuid === name) return child;

    const result = findBoneByName(child.children, name);
    if (result) return result;
  }

  return null;
};

const ReservedRe = /[\[\].:/]/g;
const TrackRe = /^((?:[^\[\].:/]+[\/:])*)([^\[\]:/]+)?(?:\.([^\[\].:/]+)(?:\[(.+)])?)?\.([^\[\].:/]+)(?:\[(.+)])?$/;
const ValidNames = ['material', 'materials', 'bones', 'map'];

enum BindType {
  Direct = 0,
  EntireArray = 1,
  ArrayElement = 2,
  HasFromToArray = 3,
}

enum Version {
  None = 0,
  NeedsUpdate = 1,
  MatrixWorldNeedsUpdate = 2,
}
