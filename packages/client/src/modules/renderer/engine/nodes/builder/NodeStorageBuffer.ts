import BindingStorageBuffer from '@modules/renderer/engine/hearth/bindings/BindingStorageBuffer.js';
import Uniform from '@modules/renderer/engine/nodes/core/Uniform.js';
import { Buffer } from '@modules/renderer/engine/core/Buffer.js';
import BindingUniformBuffer from '@modules/renderer/engine/hearth/bindings/BindingUniformBuffer.js';
import BindingSampler from '@modules/renderer/engine/hearth/bindings/BindingSampler.js';
import TextureNode from '@modules/renderer/engine/nodes/accessors/TextureNode.js';
import { BindingSampledTexture } from '@modules/renderer/engine/hearth/bindings/BindingSampledTexture.js';
import BindingUniformsGroup from '@modules/renderer/engine/hearth/bindings/BindingUniformsGroup.js';
import UniformGroupNode from '@modules/renderer/engine/nodes/core/UniformGroupNode.js';
import { BindingUniform } from '@modules/renderer/engine/hearth/bindings/BindingUniform.js';

let _storageId = 0;

export class NodeStorageBuffer extends BindingStorageBuffer {
  constructor(public uniform: Uniform<Buffer>) {
    super('StorageBuffer_' + _storageId++, uniform?.value);
  }
}

let _uniformId = 0;

export class NodeUniformBuffer extends BindingUniformBuffer {
  constructor(public uniform: Uniform<Buffer>) {
    super('UniformBuffer_' + _uniformId++, uniform?.value);
  }
}

let _samplerId = 0;

export class NodeSampler extends BindingSampler {
  constructor(
    name: string,
    public textureNode: TextureNode,
  ) {
    super(name, textureNode?.value);
  }
}

export class NodeSampledTexture extends BindingSampledTexture {
  constructor(
    name: string,
    public textureNode: TextureNode,
  ) {
    super(name, textureNode ? textureNode.value : null);

    this.textureNode = textureNode;
  }

  get needsBindingsUpdate() {
    return this.textureNode.value !== this.texture || super.needsBindingsUpdate;
  }

  update() {
    const { textureNode } = this;

    if (this.texture !== textureNode.value) {
      this.texture = textureNode.value;

      return true;
    }

    return super.update();
  }
}

export class NodeSampledCubeTexture extends NodeSampledTexture {
  declare isSampledCubeTexture: true;

  constructor(name: string, textureNode: TextureNode) {
    super(name, textureNode);
  }
}

let _groupId = 0;

export class NodeUniformsGroup extends BindingUniformsGroup {
  declare isNodeUniformsGroup: true;
  id: number;

  constructor(
    name: string,
    public groupNode: UniformGroupNode,
  ) {
    super(name);
    this.id = _groupId++;
  }

  get shared() {
    return this.groupNode.shared;
  }

  getNodes(): BindingUniform[] {
    const nodes = [];

    for (const uniform of this.uniforms) {
      const node = uniform.uniform.node;

      if (!node) throw new Error('NodeUniformsGroup: Uniform has no node.');

      nodes.push(node);
    }

    return nodes;
  }
}

NodeUniformsGroup.prototype.isNodeUniformsGroup = true;
