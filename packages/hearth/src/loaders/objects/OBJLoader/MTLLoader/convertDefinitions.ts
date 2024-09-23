import { MaterialDefinition, MaterialDefinitionRecord, Token } from './parseMTL.js';

function convertDefinition(
  definition: MaterialDefinition,
  normalizeRGB?: boolean,
  ignoreZeroRGB?: boolean,
): MaterialDefinition {
  const converted: MaterialDefinition = {};

  for (const key in definition) {
    let value = definition[key];
    const token = key.toLowerCase();

    switch (token) {
      case Token.DiffuseReflectivity:
      case Token.AmbientReflectivity:
      case Token.SpecularReflectivity:
        const [r, g, b] = value;
        if (ignoreZeroRGB && r === 0 && g === 0 && b === 0) continue;
        if (normalizeRGB) value = [+r / 255, +g / 255, +b / 255];
        break;
    }

    converted[token] = value;
  }

  return converted;
}

export function convertDefinitions(
  definitions: MaterialDefinitionRecord,
  normalizeRGB?: boolean,
  ignoreZeroRGB?: boolean,
): MaterialDefinitionRecord {
  const converted: MaterialDefinitionRecord = {};

  for (const key in definitions) {
    converted[key] = convertDefinition(definitions[key], normalizeRGB, ignoreZeroRGB);
  }

  return converted;
}
