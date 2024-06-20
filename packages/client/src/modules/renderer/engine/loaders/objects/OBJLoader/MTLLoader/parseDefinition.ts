import { ColorSpace, Side, Wrapping } from '@modules/renderer/engine/constants.js';
import { MeshPhongMaterial } from '@modules/renderer/engine/materials/MeshPhongMaterial.js';
import { TextureLoader } from '@modules/renderer/engine/loaders/textures/TextureLoader/TextureLoader.js';
import { Color } from '@modules/renderer/engine/math/Color.js';
import { Vector2 } from '@modules/renderer/engine/math/Vector2.js';
import { MaterialDefinition, Token } from '@modules/renderer/engine/loaders/objects/OBJLoader/MTLLoader/parseMTL.js';
import { LoaderUtils } from '@modules/renderer/engine/loaders/LoaderUtils.js';

const delimiterRe = /\s+/;

function parseParams(
  value: string,
  materialParams: { bumpScale?: number },
): {
  scale: Vector2;
  offset: Vector2;
  url: string;
} {
  const textureParams = {
    scale: new Vector2(1, 1),
    offset: new Vector2(0, 0),
    url: '',
  };

  const parts = value.split(delimiterRe);
  let index;

  index = parts.indexOf('-bm');
  if (index >= 0) {
    const [, scale] = parts.splice(index, 2);
    materialParams.bumpScale = +scale;
  }

  index = parts.indexOf('-s');
  if (index >= 0) {
    const [, scaleX, scaleY] = parts.splice(index, 4);
    textureParams.scale.set(+scaleX, +scaleY);
  }

  index = parts.indexOf('-o');
  if (index >= 0) {
    const [, offsetX, offsetY] = parts.splice(index, 4);
    textureParams.offset.set(+offsetX, +offsetY);
  }

  textureParams.url = parts.join(' ').trim();
  return textureParams;
}

const loadMap = async (
  baseUrl: string,
  value: string,
  materialParameters: Record<string, any>,
  wrap: Wrapping,
  useColorspace?: boolean,
) => {
  const textureParams = parseParams(value, materialParameters);
  const texture = await TextureLoader.loadAsync(LoaderUtils.resolveUrl(textureParams.url, baseUrl));

  texture.repeat.copy(textureParams.scale);
  texture.offset.copy(textureParams.offset);
  texture.wrapS = wrap;
  texture.wrapT = wrap;
  if (useColorspace) texture.colorSpace = ColorSpace.SRGB;

  return texture;
};

export async function parseDefinition(
  baseUrl: string,
  name: string,
  definition: MaterialDefinition,
  side: Side,
  wrap: Wrapping,
): Promise<MeshPhongMaterial> {
  const materialParameters: Record<string, any> = {
    name,
    side,
    bumpScale: undefined! as number,
  };

  for (const token in definition) {
    const value = definition[token];

    if (value === '') continue;

    switch (token.toLowerCase()) {
      case Token.DiffuseReflectivity: {
        materialParameters.color = new Color().fromArray(value as number[]).convertSRGBToLinear();
        break;
      }
      case Token.SpecularReflectivity: {
        materialParameters.specular = new Color().fromArray(value as number[]).convertSRGBToLinear();
        break;
      }
      case Token.EmissiveReflectivity: {
        materialParameters.emissive = new Color().fromArray(value as number[]).convertSRGBToLinear();
        break;
      }
      case Token.DiffuseMap: {
        materialParameters.map = await loadMap(baseUrl, value as string, materialParameters, wrap, true);
        break;
      }
      case Token.SpecularMap: {
        materialParameters.specularMap = await loadMap(baseUrl, value as string, materialParameters, wrap, false);
        break;
      }
      case Token.EmissiveMap: {
        materialParameters.emissiveMap = await loadMap(baseUrl, value as string, materialParameters, wrap, true);
        break;
      }
      case Token.NormalMap: {
        materialParameters.normalMap = await loadMap(baseUrl, value as string, materialParameters, wrap, false);
        break;
      }
      case Token.BumpMap:
      case Token.Bump: {
        materialParameters.bumpMap = await loadMap(baseUrl, value as string, materialParameters, wrap, false);
        break;
      }
      case Token.TransparencyMap: {
        materialParameters.alphaMap = await loadMap(baseUrl, value as string, materialParameters, wrap, false);
        materialParameters.transparent = true;
        break;
      }
      case Token.SpecularExponent: {
        materialParameters.shininess = +value;
        break;
      }
      case Token.Opacity: {
        let opacity = +value;
        if (opacity < 1) {
          materialParameters.opacity = opacity;
          materialParameters.transparent = true;
        }
        break;
      }
      case Token.Transparency: {
        let opacity = +value;
        if (opacity > 0) {
          materialParameters.opacity = 1 - opacity;
          materialParameters.transparent = true;
        }
        break;
      }
    }
  }

  return new MeshPhongMaterial(materialParameters);
}
