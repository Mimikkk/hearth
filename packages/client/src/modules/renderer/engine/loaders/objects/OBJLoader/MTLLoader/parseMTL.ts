import { MTLMaterialCreator } from '@modules/renderer/engine/loaders/objects/OBJLoader/MTLLoader/MTLMaterialCreator.js';

export type MaterialDefinition = Record<string, string | number[]>;
export type MaterialDefinitionRecord = Record<string, MaterialDefinition>;
const isEmpty = (value: string): boolean => value.length === 0;
const isComment = (value: string): boolean => value.charAt(0) === Token.Comment;

const delimiterRe = /\s+/;
export const parseMTL = (text: string, path: string): MTLMaterialCreator => {
  const lines = text.split('\n');
  const definitions: MaterialDefinitionRecord = {};

  let definition: MaterialDefinition = {};
  for (let i = 0; i < lines.length; ++i) {
    const line = lines[i].trim();
    if (isEmpty(line) || isComment(line)) continue;

    const index = line.indexOf(' ');
    const token = (index >= 0 ? line.substring(0, index) : line).toLowerCase();
    const value = index >= 0 ? line.substring(index + 1).trim() : '';

    if (token === Token.NewMaterial) {
      definition = { name: value };
      definitions[value] = definition;
    } else {
      if (
        token === Token.AmbientReflectivity ||
        token === Token.DiffuseReflectivity ||
        token === Token.SpecularReflectivity ||
        token === Token.EmissiveReflectivity
      ) {
        const [r, g, b] = value.split(delimiterRe, 3);
        definition[token] = [+r, +g, +b];
      } else {
        definition[token] = value;
      }
    }
  }

  return new MTLMaterialCreator(path, { definitions });
};

export const enum Token {
  Comment = 'newmtl',
  NewMaterial = 'newmtl',
  AmbientReflectivity = 'ka',
  DiffuseReflectivity = 'kd',
  SpecularReflectivity = 'ks',
  EmissiveReflectivity = 'ke',
  SpecularExponent = 'ns',
  Opacity = 'd',
  Transparency = 'tr',
  IlluminationModel = 'illum',
  AmbientMap = 'map_ka',
  DiffuseMap = 'map_kd',
  SpecularMap = 'map_ks',
  SpecularExponentMap = 'map_ns',
  EmissiveMap = 'map_ke',
  TransparencyMap = 'map_d',
  BumpMap = 'map_bump',
  Bump = 'bump',
  NormalMap = 'norm',
  DisplacementMap = 'disp',
  StencilDecalMap = 'decal',
  ReflectionMap = 'refl',
}
