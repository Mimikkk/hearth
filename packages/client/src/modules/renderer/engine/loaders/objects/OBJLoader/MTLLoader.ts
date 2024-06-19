import { Color, ColorSpace, LoaderUtils, MeshPhongMaterial, Side, Vector2, Wrapping } from '../../../engine.js';
import { FileLoader, ResponseType } from '@modules/renderer/engine/loaders/files/FileLoader/FileLoader.js';
import { TextureLoader } from '@modules/renderer/engine/loaders/textures/TextureLoader/TextureLoader.js';
import { classLoader, Configurable, ConfigurableConstructor } from '@modules/renderer/engine/loaders/types.js';

const parse = (text: string, path: string) => {
  const lines = text.split('\n');
  let info = {};
  const delimiter_pattern = /\s+/;
  const materialsInfo = {};

  for (let i = 0; i < lines.length; ++i) {
    let line = lines[i];
    line = line.trim();

    if (line.length === 0 || line.charAt(0) === '#') continue;

    const pos = line.indexOf(' ');

    let key = pos >= 0 ? line.substring(0, pos) : line;
    key = key.toLowerCase();

    let value = pos >= 0 ? line.substring(pos + 1) : '';
    value = value.trim();

    if (key === 'newmtl') {
      // New material

      info = { name: value };
      materialsInfo[value] = info;
    } else {
      if (key === 'ka' || key === 'kd' || key === 'ks' || key === 'ke') {
        const ss = value.split(delimiter_pattern, 3);
        info[key] = [parseFloat(ss[0]), parseFloat(ss[1]), parseFloat(ss[2])];
      } else {
        info[key] = value;
      }
    }
  }

  const materialCreator = new MaterialCreator(path);
  materialCreator.setMaterials(materialsInfo);

  console.log(materialCreator);
  return materialCreator;
};

export class MTLLoader extends classLoader<{
  Url: string;
  Return: MaterialCreator;
  Options: Options;
  Configuration: Configuration;
}>(
  options => ({ fileLoader: FileLoader.configureAs(ResponseType.Text, options?.fileLoader) }),
  async (url, { fileLoader }, handlers) => {
    const path = LoaderUtils.extractUrlBase(url);

    const text = await FileLoader.loadAsync(url, fileLoader, handlers);

    return parse(text, path);
  },
) {}

export namespace MTLLoader {
  export interface Options {
    fileLoader?: FileLoader.Options;
  }

  export interface Configuration {
    fileLoader: FileLoader.Configuration<ResponseType.Text>;
  }
}
type Options = MTLLoader.Options;
type Configuration = MTLLoader.Configuration;

type MaterialsInfo = Record<string, Record<string, string | number[]>>;
export const MaterialCreator = class implements Configurable<MaterialCreator.Configuration> {
  configuration: MaterialCreator.Configuration;

  static configure(options?: MaterialCreator.Options): MaterialCreator.Configuration {
    return {
      normalizeRGB: options?.normalizeRGB ?? false,
      ignoreZeroRGBs: options?.ignoreZeroRGBs ?? false,
      side: options?.side ?? Side.Front,
      wrap: options?.wrap ?? Wrapping.Repeat,
      invertTrProperty: options?.invertTrProperty ?? false,
    };
  }

  baseUrl: string;
  materialsInfo: MaterialsInfo;
  materials: Record<string, MeshPhongMaterial>;
  materialsArray: MeshPhongMaterial[];
  nameLookup: Record<string, number>;

  constructor(baseUrl: string, options: Options = {}) {
    this.configuration = MaterialCreator.configure(options);
    this.baseUrl = baseUrl;
    this.materialsInfo = {};
    this.materials = {};
    this.materialsArray = [];
    this.nameLookup = {};
  }

  setMaterials(materialsInfo: MaterialsInfo) {
    this.materialsInfo = this.convert(materialsInfo);
    this.materials = {};
    this.materialsArray = [];
    this.nameLookup = {};
  }

  convert(materialsInfo: MaterialsInfo): MaterialsInfo {
    const converted: MaterialsInfo = {};

    for (const mn in materialsInfo) {
      const mat = materialsInfo[mn];

      const covmat: MaterialsInfo[string] = {};
      converted[mn] = covmat;

      for (const prop in mat) {
        let save = true;
        let value = mat[prop];
        const lprop = prop.toLowerCase();

        switch (lprop) {
          case 'kd':
          case 'ka':
          case 'ks':
            if (this.configuration.normalizeRGB) {
              value = [+value[0] / 255, +value[1] / 255, +value[2] / 255];
            }
            if (this.configuration.ignoreZeroRGBs) {
              if (value[0] === 0 && value[1] === 0 && value[2] === 0) {
                // ignore

                save = false;
              }
            }
            break;
        }

        if (save) {
          covmat[lprop] = value;
        }
      }
    }

    return converted;
  }

  async preload() {
    for (const mn in this.materialsInfo) {
      await this.create(mn);
    }
    console.log({ t: this.materialsInfo });
  }

  getIndex(materialName: string): number | undefined {
    return this.nameLookup[materialName];
  }

  async create(materialName: string): Promise<MeshPhongMaterial> {
    if (this.materials[materialName] === undefined) {
      await this.createMaterial_(materialName);
    }

    return this.materials[materialName];
  }

  async createMaterial_(materialName: string): Promise<MeshPhongMaterial> {
    const scope = this;
    const mat = this.materialsInfo[materialName];
    const params = {
      name: materialName,
      side: this.configuration.side,
    };

    function resolveURL(baseUrl: string, url: string): string {
      if (typeof url !== 'string' || url === '') return '';

      // Absolute URL
      if (/^https?:\/\//i.test(url)) return url;

      return baseUrl + url;
    }

    async function setMapForType(mapType: string, value: string) {
      if (params[mapType]) return;

      const texParams = scope.getTextureParams(value, params);
      const map = await TextureLoader.loadAsync(resolveURL(scope.baseUrl, texParams.url));

      map.repeat.copy(texParams.scale);
      map.offset.copy(texParams.offset);

      map.wrapS = scope.configuration.wrap;
      map.wrapT = scope.configuration.wrap;

      if (mapType === 'map' || mapType === 'emissiveMap') {
        map.colorSpace = ColorSpace.SRGB;
      }

      params[mapType] = map;
    }

    for (const prop in mat) {
      const value = mat[prop];
      let n;

      if (value === '') continue;
      switch (prop.toLowerCase()) {
        // Ns is material specular exponent

        case 'kd':
          // Diffuse color (color under white light) using RGB values

          params.color = new Color().fromArray(value).convertSRGBToLinear();

          break;

        case 'ks':
          // Specular color (color when light is reflected from shiny surface) using RGB values
          params.specular = new Color().fromArray(value).convertSRGBToLinear();

          break;

        case 'ke':
          // Emissive using RGB values
          params.emissive = new Color().fromArray(value).convertSRGBToLinear();

          break;

        case 'map_kd':
          // Diffuse texture map

          await setMapForType('map', value);

          break;

        case 'map_ks':
          // Specular map

          await setMapForType('specularMap', value);

          break;

        case 'map_ke':
          // Emissive map

          await setMapForType('emissiveMap', value);

          break;

        case 'norm':
          await setMapForType('normalMap', value);

          break;

        case 'map_bump':
        case 'bump':
          // Bump texture map

          await setMapForType('bumpMap', value);

          break;

        case 'map_d':
          // Alpha map

          await setMapForType('alphaMap', value);
          params.transparent = true;

          break;

        case 'ns':
          // The specular exponent (defines the focus of the specular highlight)
          // A high exponent results in a tight, concentrated highlight. Ns values normally range from 0 to 1000.

          params.shininess = parseFloat(value);

          break;

        case 'd':
          n = parseFloat(value);

          if (n < 1) {
            params.opacity = n;
            params.transparent = true;
          }

          break;

        case 'tr':
          n = parseFloat(value);

          if (this.configuration.invertTrProperty) n = 1 - n;

          if (n > 0) {
            params.opacity = 1 - n;
            params.transparent = true;
          }

          break;

        default:
          break;
      }
    }

    this.materials[materialName] = new MeshPhongMaterial(params);
    return this.materials[materialName];
  }

  getTextureParams(value, matParams) {
    const texParams = {
      scale: new Vector2(1, 1),
      offset: new Vector2(0, 0),
    };

    const items = value.split(/\s+/);
    let pos;

    pos = items.indexOf('-bm');

    if (pos >= 0) {
      matParams.bumpScale = parseFloat(items[pos + 1]);
      items.splice(pos, 2);
    }

    pos = items.indexOf('-s');

    if (pos >= 0) {
      texParams.scale.set(parseFloat(items[pos + 1]), parseFloat(items[pos + 2]));
      items.splice(pos, 4); // we expect 3 parameters here!
    }

    pos = items.indexOf('-o');

    if (pos >= 0) {
      texParams.offset.set(parseFloat(items[pos + 1]), parseFloat(items[pos + 2]));
      items.splice(pos, 4); // we expect 3 parameters here!
    }

    texParams.url = items.join(' ').trim();
    return texParams;
  }
} satisfies ConfigurableConstructor<MaterialCreator.Options, MaterialCreator.Configuration>;
export type MaterialCreator = InstanceType<typeof MaterialCreator>;

export namespace MaterialCreator {
  export interface Options {
    normalizeRGB?: boolean;
    ignoreZeroRGBs?: boolean;
    side?: Side;
    wrap?: Wrapping;
    invertTrProperty?: boolean;
  }

  export interface Configuration {
    normalizeRGB: boolean;
    ignoreZeroRGBs: boolean;
    side: Side;
    wrap: Wrapping;
    invertTrProperty: boolean;
  }
}
