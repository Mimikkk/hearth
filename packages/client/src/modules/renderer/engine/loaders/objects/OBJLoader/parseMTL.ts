import { MaterialCreator } from '@modules/renderer/engine/loaders/objects/OBJLoader/MaterialCreator.js';

export const parseMTL = (text: string, path: string): MaterialCreator => {
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
  return materialCreator;
};
