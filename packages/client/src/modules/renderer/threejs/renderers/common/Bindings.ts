import DataMap from './DataMap.js';
import { AttributeType } from './Constants.js';
import { Renderer } from '@modules/renderer/threejs/renderers/common/Renderer.js';
import RenderObject from '@modules/renderer/threejs/renderers/common/RenderObject.js';
import Binding from '@modules/renderer/threejs/renderers/common/Binding.js';
import ComputeNode from 'three/examples/jsm/nodes/gpgpu/ComputeNode.js';
import { SampledTexture } from '@modules/renderer/threejs/renderers/common/SampledTexture.js';
import NodeUniformsGroup from '@modules/renderer/threejs/renderers/common/nodes/NodeUniformsGroup.js';
import UniformBuffer from '@modules/renderer/threejs/renderers/common/UniformBuffer.js';
import StorageTexture from '@modules/renderer/threejs/renderers/common/StorageTexture.js';
import StorageBuffer from '@modules/renderer/threejs/renderers/common/StorageBuffer.js';

class Bindings extends DataMap<any, any> {
  constructor(public renderer: Renderer) {
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
      const nodeBuilderState = this.renderer._nodes.getForCompute(computeNode);

      const bindings = nodeBuilderState.bindings;

      data.bindings = bindings;

      this._init(bindings);

      this.renderer.backend.createBindings(bindings);
    }

    return data.bindings;
  }

  updateForCompute(computeNode: ComputeNode): void {
    this._update(this.getForCompute(computeNode));
  }

  updateForRender(renderObject: RenderObject): void {
    this._update(this.getForRender(renderObject));
  }

  _init(bindings: Binding[]): void {
    for (const binding of bindings) {
      if (binding instanceof SampledTexture) {
        this.renderer._textures.updateTexture(binding.texture);
      } else if (binding instanceof StorageBuffer) {
        const attribute = binding.attribute;

        this.renderer._attributes.update(attribute, AttributeType.Storage);
      }
    }
  }

  _update(bindings: Binding[]): void {
    let needsBindingsUpdate = false;

    // iterate over all bindings and check if buffer updates or a new binding group is required

    for (const binding of bindings) {
      if (binding instanceof NodeUniformsGroup) {
        const updated = this.renderer._nodes.updateGroup(binding);

        if (!updated) continue;
      }

      if (binding instanceof UniformBuffer) {
        const updated = binding.update();

        if (updated) {
          this.renderer.backend.updateBinding(binding);
        }
      } else if (binding instanceof SampledTexture) {
        const texture = binding.texture;

        if (binding.needsBindingsUpdate) needsBindingsUpdate = true;

        const updated = binding.update();

        if (updated) {
          this.renderer._textures.updateTexture(binding.texture);
        }

        if (texture instanceof StorageTexture) {
          const textureData = this.get(texture);

          if (binding.store === true) {
            textureData.needsMipmap = true;
          } else if (
            texture.generateMipmaps === true &&
            this.renderer._textures.needsMipmaps(texture) &&
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

export default Bindings;
