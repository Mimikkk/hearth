import DataMap from './DataMap.js';
import { AttributeLocation } from './constants.js';
import { Forge } from '@modules/renderer/engine/renderers/Forge.js';
import RenderObject from '@modules/renderer/engine/renderers/RenderObject.js';
import Binding from '@modules/renderer/engine/renderers/bindings/Binding.js';
import { BindingSampledTexture } from '@modules/renderer/engine/renderers/bindings/BindingSampledTexture.js';
import BindingUniformBuffer from '@modules/renderer/engine/renderers/bindings/BindingUniformBuffer.js';
import StorageTexture from '@modules/renderer/engine/objects/textures/StorageTexture.js';
import BindingStorageBuffer from '@modules/renderer/engine/renderers/bindings/BindingStorageBuffer.js';
import { ComputeNode } from '@modules/renderer/engine/nodes/Nodes.js';
import { NodeUniformsGroup } from '@modules/renderer/engine/nodes/builder/NodeStorageBuffer.js';

export class ForgeBindings extends DataMap<any, any> {
  constructor(public renderer: Forge) {
    super();
  }

  getForRender(renderObject: RenderObject): Binding[] {
    const bindings = renderObject.getBindings();

    const data = this.get(renderObject);

    if (data.bindings !== bindings) {
      // each object defines an array of bindings (ubos, textures, samplers etc.)

      data.bindings = bindings;

      this._init(bindings);

      this.renderer.backend.createBindings(bindings);
    }

    return data.bindings;
  }

  getForCompute(computeNode: ComputeNode): Binding[] {
    const data = this.get(computeNode);

    if (data.bindings === undefined) {
      const nodeBuilderState = this.renderer.nodes.getForCompute(computeNode);

      const bindings = nodeBuilderState.bindings;

      data.bindings = bindings;

      this._init(bindings);

      this.renderer.backend.createBindings(bindings);
    }

    return data.bindings;
  }

  updateForCompute(computeNode: ComputeNode): void {
    this.update(this.getForCompute(computeNode));
  }

  updateForRender(renderObject: RenderObject): void {
    this.update(this.getForRender(renderObject));
  }

  _init(bindings: Binding[]): void {
    for (const binding of bindings) {
      if (binding instanceof BindingSampledTexture) {
        this.renderer.textures.updateTexture(binding.texture);
      } else if (binding instanceof BindingStorageBuffer) {
        const attribute = binding.attribute;

        this.renderer.attributes.update(attribute, AttributeLocation.Storage);
      }
    }
  }

  update(bindings: Binding[]): void {
    let needsBindingsUpdate = false;

    // iterate over all bindings and check if buffer updates or a new binding group is required

    for (const binding of bindings) {
      if (binding instanceof NodeUniformsGroup) {
        const updated = this.renderer.nodes.updateGroup(binding);

        if (!updated) continue;
      }

      if (binding instanceof BindingUniformBuffer) {
        const updated = binding.update();

        if (updated) {
          this.renderer.backend.updateBinding(binding);
        }
      } else if (binding instanceof BindingSampledTexture) {
        const texture = binding.texture;

        if (binding.needsBindingsUpdate) needsBindingsUpdate = true;

        const updated = binding.update();

        if (updated) {
          this.renderer.textures.updateTexture(binding.texture);
        }

        if (texture instanceof StorageTexture) {
          const textureData = this.get(texture);

          if (binding.store === true) {
            textureData.needsMipmap = true;
          } else if (
            texture.generateMipmaps === true &&
            this.renderer.textures.needsMipmaps(texture) &&
            textureData.needsMipmap === true
          ) {
            this.renderer.backend.generateMipmaps(texture);

            textureData.needsMipmap = false;
          }
        }
      }
    }

    if (needsBindingsUpdate === true) {
      this.renderer.backend.updateBindings(bindings);
    }
  }
}
