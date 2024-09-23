import { Vec2 } from '../../../../math/Vec2.js';
import { GPUAddressModeType } from '../../../../hearth/constants.js';
import { TextureLoader } from '../../../textures/TextureLoader/TextureLoader.js';
import { LoaderUtils } from '../../../LoaderUtils.js';
import { ColorSpace, Side } from '../../../../constants.js';
import { MaterialDefinition, Token } from './parseMTL.js';
import { MeshPhongMaterial } from '../../../../entities/materials/MeshPhongMaterial.js';
import { Color } from '../../../../math/Color.js';

const delimiterRe = /\s+/;

function parseParams(
  value: string,
  materialParams: { bumpScale?: number },
): {
  scale: Vec2;
  offset: Vec2;
  url: string;
} {
  const textureParams = {
    scale: Vec2.new(1, 1),
    offset: Vec2.new(0, 0),
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
  wrap: GPUAddressModeType,
  useColorspace?: boolean,
) => {
  const textureParams = parseParams(value, materialParameters);
  const texture = await TextureLoader.loadAsync(LoaderUtils.resolveUrl(textureParams.url, baseUrl));

  texture.repeat.from(textureParams.scale);
  texture.offset.from(textureParams.offset);
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
  wrap: GPUAddressModeType,
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
        materialParameters.color = Color.new()
          .fromArray(value as number[])
          .asSRGBToLinear();
        break;
      }
      case Token.SpecularReflectivity: {
        materialParameters.specular = Color.new()
          .fromArray(value as number[])
          .asSRGBToLinear();
        break;
      }
      case Token.EmissiveReflectivity: {
        materialParameters.emissive = Color.new()
          .fromArray(value as number[])
          .asSRGBToLinear();
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
