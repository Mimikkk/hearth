import { classLoader } from '../../../types.js';
import { MeshPhongMaterial } from '../../../../entities/materials/MeshPhongMaterial.js';
import { Side } from '../../../../constants.js';
import { GPUAddressModeType } from '../../../../hearth/constants.js';
import { convertDefinitions } from './convertDefinitions.js';
import { parseDefinition } from './parseDefinition.js';
import { MaterialDefinitionRecord } from './parseMTL.js';

export class MTLMaterialCreator extends classLoader<{
  This: MTLMaterialCreator;
  Url: string;
  Return: MeshPhongMaterial;
  Options: Options;
  Configuration: Configuration;
}>(
  options => ({
    normalizeRGB: options?.normalizeRGB ?? false,
    ignoreZeroRGBs: options?.ignoreZeroRGBs ?? false,
    side: options?.side ?? Side.Front,
    wrap: options?.wrap ?? GPUAddressModeType.Repeat,
    invertTrProperty: options?.invertTrProperty ?? false,
    definitions: options?.definitions
      ? convertDefinitions(options.definitions, options?.normalizeRGB ?? false, options?.ignoreZeroRGBs ?? false)
      : {},
  }),
  async function (name, { definitions, side, wrap }) {
    let material = this.materials.get(name);
    if (material) return material;
    material = await parseDefinition(this.directoryUrl, name, definitions[name], side, wrap);
    this.materials.set(name, material);
    return material;
  },
) {
  materials: Map<string, MeshPhongMaterial> = new Map<string, MeshPhongMaterial>();

  constructor(
    public directoryUrl: string,
    options?: Options,
  ) {
    super(options);
  }

  async preload() {
    const promises = [];

    for (const name in this.configuration.definitions) {
      promises.push(this.loadAsync(name));
    }

    await Promise.all(promises);
  }
}

export namespace MTLMaterialCreator {
  export interface Options {
    normalizeRGB?: boolean;
    ignoreZeroRGBs?: boolean;
    side?: Side;
    wrap?: GPUAddressModeType;
    invertTrProperty?: boolean;
    definitions?: MaterialDefinitionRecord;
  }

  export interface Configuration {
    normalizeRGB: boolean;
    ignoreZeroRGBs: boolean;
    side: Side;
    wrap: GPUAddressModeType;
    definitions: MaterialDefinitionRecord;
  }
}
type Options = MTLMaterialCreator.Options;
type Configuration = MTLMaterialCreator.Configuration;
