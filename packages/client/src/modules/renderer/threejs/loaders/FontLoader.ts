import { FileLoader, Loader, ShapePath } from '../../threejs/Three.js';

export class FontLoader<TUrl extends string = string> extends Loader {
  responseType: 'json' = 'json';

  constructor(options?: FontLoader.Options) {
    super(options);
  }

  load(url: TUrl, handlers?: Loader.Handlers<Font>) {
    FileLoader.load(url, this, {
      onLoad: this.createOnLoad(handlers?.onLoad),
      onProgress: handlers?.onProgress,
      onError: handlers?.onError,
    });
  }

  parse(json: any) {
    return new Font(json);
  }

  createOnLoad(onLoad: undefined | Loader.OnLoad<Font>) {
    return (json: any) => onLoad?.(this.parse(json));
  }
}

//

export class Font {
  type: 'Font' = 'Font';

  constructor(public data: any) {}

  generateShapes(text: string, size = 100) {
    const shapes = [];
    const paths = createPaths(text, size, this.data);

    for (let p = 0, pl = paths.length; p < pl; p++) {
      shapes.push(...paths[p].toShapes());
    }

    return shapes;
  }
}

function createPaths(text: string, size: number, data: any) {
  const chars = Array.from(text);
  const scale = size / data.resolution;
  const line_height = (data.boundingBox.yMax - data.boundingBox.yMin + data.underlineThickness) * scale;

  const paths = [];

  let offsetX = 0,
    offsetY = 0;

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];

    if (char === '\n') {
      offsetX = 0;
      offsetY -= line_height;
    } else {
      const ret = createPath(char, scale, offsetX, offsetY, data);
      offsetX += ret.offsetX;
      paths.push(ret.path);
    }
  }

  return paths;
}

function createPath(char: string, scale: number, offsetX: number, offsetY: number, data: any) {
  const glyph = data.glyphs[char] || data.glyphs['?'];

  if (!glyph) {
    console.error('THREE.Font: character "' + char + '" does not exists in font family ' + data.familyName + '.');

    return;
  }

  const path = new ShapePath();

  let x, y, cpx, cpy, cpx1, cpy1, cpx2, cpy2;

  if (glyph.o) {
    const outline = glyph._cachedOutline || (glyph._cachedOutline = glyph.o.split(' '));

    for (let i = 0, l = outline.length; i < l; ) {
      const action = outline[i++];

      switch (action) {
        case 'm': // moveTo
          x = outline[i++] * scale + offsetX;
          y = outline[i++] * scale + offsetY;

          path.moveTo(x, y);

          break;

        case 'l': // lineTo
          x = outline[i++] * scale + offsetX;
          y = outline[i++] * scale + offsetY;

          path.lineTo(x, y);

          break;

        case 'q': // quadraticCurveTo
          cpx = outline[i++] * scale + offsetX;
          cpy = outline[i++] * scale + offsetY;
          cpx1 = outline[i++] * scale + offsetX;
          cpy1 = outline[i++] * scale + offsetY;

          path.quadraticCurveTo(cpx1, cpy1, cpx, cpy);

          break;

        case 'b': // bezierCurveTo
          cpx = outline[i++] * scale + offsetX;
          cpy = outline[i++] * scale + offsetY;
          cpx1 = outline[i++] * scale + offsetX;
          cpy1 = outline[i++] * scale + offsetY;
          cpx2 = outline[i++] * scale + offsetX;
          cpy2 = outline[i++] * scale + offsetY;

          path.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, cpx, cpy);

          break;
      }
    }
  }

  return { offsetX: glyph.ha * scale, path: path };
}

export namespace FontLoader {
  export interface Options extends Pick<Loader.Options, 'manager' | 'path' | 'requestHeader' | 'withCredentials'> {}
}
