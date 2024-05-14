import DataMap from './DataMap.js';
import { AttributeType } from './Constants.js';
import Pipelines from '@modules/renderer/threejs/renderers/common/Pipelines.js';
import Backend from '@modules/renderer/threejs/renderers/common/Backend.js';
import Nodes from '@modules/renderer/threejs/renderers/common/nodes/Nodes.js';
import Textures from '@modules/renderer/threejs/renderers/common/Textures.js';
import Attributes from '@modules/renderer/threejs/renderers/common/Attributes.js';
import { Info } from '@modules/renderer/threejs/renderers/common/Info.js';
import { Renderer } from '@modules/renderer/threejs/renderers/common/Renderer.js';
import RenderObject from '@modules/renderer/threejs/renderers/common/RenderObject.js';
import Binding from '@modules/renderer/threejs/renderers/common/Binding.js';
import RenderObjects from '@modules/renderer/threejs/renderers/common/RenderObjects.js';
import ComputeNode from 'three/examples/jsm/nodes/gpgpu/ComputeNode.js';
import { Object3D } from '@modules/renderer/threejs/core/Object3D.js';

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
    this._update(computeNode, this.getForCompute(computeNode));
  }

  updateForRender(renderObject: RenderObject): void {
    this._update(renderObject, this.getForRender(renderObject));
  }

  _init(bindings: Binding[]): void {
    for (const binding of bindings) {
      if (binding.isSampledTexture) {
        this.renderer._textures.updateTexture(binding.texture);
      } else if (binding.isStorageBuffer) {
        const attribute = binding.attribute;

        this.renderer._attributes.update(attribute, AttributeType.Storage);
      }
    }
  }

  _update(object: Object3D, bindings: Binding[]): void {
    let needsBindingsUpdate = false;

    // iterate over all bindings and check if buffer updates or a new binding group is required

    for (const binding of bindings) {
      if (binding.isNodeUniformsGroup) {
        const updated = this.renderer._nodes.updateGroup(binding);

        if (!updated) continue;
      }

      if (binding.isUniformBuffer) {
        const updated = binding.update();

        if (updated) {
          this.renderer.backend.updateBinding(binding);
        }
      } else if (binding.isSampledTexture) {
        const texture = binding.texture;

        if (binding.needsBindingsUpdate) needsBindingsUpdate = true;

        const updated = binding.update();

        if (updated) {
          this.renderer._textures.updateTexture(binding.texture);
        }

        if (texture.isStorageTexture === true) {
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
      const pipeline = this.renderer._pipelines.getForRender(object);

      this.renderer.backend.updateBindings(bindings, pipeline);
    }
  }
}

export default Bindings;
