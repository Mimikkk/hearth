import { classConfigurable } from '@modules/renderer/engine/loaders/types.js';
import { ColorSpace, Side, Wrapping } from '@modules/renderer/engine/constants.js';
import { MeshPhongMaterial } from '@modules/renderer/engine/materials/MeshPhongMaterial.js';
import { TextureLoader } from '@modules/renderer/engine/loaders/textures/TextureLoader/TextureLoader.js';
import { Color } from '@modules/renderer/engine/math/Color.js';
import { Vector2 } from '@modules/renderer/engine/math/Vector2.js';

type MaterialsInfo = Record<string, Record<string, string | number[]>>;

function convert(materialsInfo: MaterialsInfo, normalizeRGB?: boolean, ignoreZeroRGBs?: boolean): MaterialsInfo {
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
          if (normalizeRGB) {
            value = [+value[0] / 255, +value[1] / 255, +value[2] / 255];
          }
          if (ignoreZeroRGBs) {
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

export class MaterialCreator extends classConfigurable<Options, Configuration>(options => ({
  normalizeRGB: options?.normalizeRGB ?? false,
  ignoreZeroRGBs: options?.ignoreZeroRGBs ?? false,
  side: options?.side ?? Side.Front,
  wrap: options?.wrap ?? Wrapping.Repeat,
  invertTrProperty: options?.invertTrProperty ?? false,
  materialsInfo: options?.materialsInfo
    ? convert(options.materialsInfo, options?.normalizeRGB, options?.ignoreZeroRGBs)
    : {},
})) {
  baseUrl: string;
  materials: Record<string, MeshPhongMaterial>;
  materialsArray: MeshPhongMaterial[];
  nameLookup: Record<string, number>;

  constructor(baseUrl: string, options?: Options) {
    super(options);
    this.baseUrl = baseUrl;
    this.materials = {};
    this.materialsArray = [];
    this.nameLookup = {};
  }

  setMaterials(materialsInfo: MaterialsInfo) {
    this.configuration.materialsInfo = convert(
      materialsInfo,
      this.configuration.normalizeRGB,
      this.configuration.ignoreZeroRGBs,
    );
    this.materials = {};
    this.materialsArray = [];
    this.nameLookup = {};
  }

  async preload() {
    const promises = [];

    for (const mn in this.configuration.materialsInfo) {
      promises.push(this.create(mn));
    }

    await Promise.all(promises);
  }

  getIndex(materialName: string): number | undefined {
    return this.nameLookup[materialName];
  }

  async create(materialName: string): Promise<MeshPhongMaterial> {
    if (this.materials[materialName] === undefined) {
      await this.createMaterial(materialName);
    }

    return this.materials[materialName];
  }

  async createMaterial(materialName: string): Promise<MeshPhongMaterial> {
    const scope = this;
    const mat = this.configuration.materialsInfo[materialName];
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

  getTextureParams(
    value: string,
    matParams: { bumpScale: number },
  ): {
    scale: Vector2;
    offset: Vector2;
    url: string;
  } {
    const texParams = {
      scale: new Vector2(1, 1),
      offset: new Vector2(0, 0),
      url: '',
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
      // we expect 3
      items.splice(pos, 4);
    }

    pos = items.indexOf('-o');

    if (pos >= 0) {
      texParams.offset.set(parseFloat(items[pos + 1]), parseFloat(items[pos + 2]));
      // we expect 3
      items.splice(pos, 4);
    }

    texParams.url = items.join(' ').trim();
    return texParams;
  }
}

export namespace MaterialCreator {
  export interface Options {
    normalizeRGB?: boolean;
    ignoreZeroRGBs?: boolean;
    side?: Side;
    wrap?: Wrapping;
    invertTrProperty?: boolean;
    materialsInfo?: MaterialsInfo;
  }

  export interface Configuration {
    normalizeRGB: boolean;
    ignoreZeroRGBs: boolean;
    side: Side;
    wrap: Wrapping;
    invertTrProperty: boolean;
    materialsInfo: MaterialsInfo;
  }
}
type Options = MaterialCreator.Options;
type Configuration = MaterialCreator.Configuration;
