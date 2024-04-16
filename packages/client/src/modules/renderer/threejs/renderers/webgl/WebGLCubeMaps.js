import { Mapping } from '../../constants.ts';
import { WebGLCubeRenderTarget } from '../WebGLCubeRenderTarget.js';

function WebGLCubeMaps(renderer) {
  let cubemaps = new WeakMap();

  function mapTextureMapping(texture, mapping) {
    if (mapping === Mapping.EquirectangularReflection) {
      texture.mapping = Mapping.CubeReflection;
    } else if (mapping === Mapping.EquirectangularRefraction) {
      texture.mapping = Mapping.CubeRefraction;
    }

    return texture;
  }

  function get(texture) {
    if (texture && texture.isTexture) {
      const mapping = texture.mapping;

      if (mapping === Mapping.EquirectangularReflection || mapping === Mapping.EquirectangularRefraction) {
        if (cubemaps.has(texture)) {
          const cubemap = cubemaps.get(texture).texture;
          return mapTextureMapping(cubemap, texture.mapping);
        } else {
          const image = texture.image;

          if (image && image.height > 0) {
            const renderTarget = new WebGLCubeRenderTarget(image.height);
            renderTarget.fromEquirectangularTexture(renderer, texture);
            cubemaps.set(texture, renderTarget);

            texture.eventDispatcher.add('dispose', onTextureDispose);

            return mapTextureMapping(renderTarget.texture, texture.mapping);
          } else {
            // image not yet ready. try the conversion next frame

            return null;
          }
        }
      }
    }

    return texture;
  }

  function onTextureDispose(event) {
    const texture = event.target;

    texture.removeEventListener('dispose', onTextureDispose);

    const cubemap = cubemaps.get(texture);

    if (cubemap !== undefined) {
      cubemaps.delete(texture);
      cubemap.dispose();
    }
  }

  function dispose() {
    cubemaps = new WeakMap();
  }

  return {
    get: get,
    dispose: dispose,
  };
}

export { WebGLCubeMaps };
