import type { Font } from './font.js';
import { Shape } from '@modules/renderer/engine/math/curves/Shape.js';
import { ShapePath } from '@modules/renderer/engine/math/curves/ShapePath.js';

const createOutlines = ({ glyphs }: Font) => {
  const outlines = new Map<string, string[]>();

  for (const character in glyphs) {
    const outline = glyphs[character].o;
    if (outline) outlines.set(character, outline.split(' '));
  }

  return outlines;
};

export class FontManager {
  outlines: Map<string, string[]>;

  static create(font: Font) {
    return new FontManager(font);
  }

  constructor(public font: Font) {
    this.outlines = createOutlines(font);
  }

  createShapes(text: string, size: number): Shape[] {
    const shapes = [];
    const paths = this.createPaths(text, size);

    for (let i = 0, it = paths.length; i < it; ++i) {
      shapes.push(...paths[i].toShapes(false));
    }

    return shapes;
  }

  createPaths(text: string, size: number): ShapePath[] {
    const {
      font: {
        boundingBox: { yMax, yMin },
        glyphs,
        resolution,
        underlineThickness,
        familyName,
      },
      outlines,
    } = this;
    const scale = size / resolution;
    const line_height = (yMax - yMin + underlineThickness) * scale;

    const paths = [];

    let offsetX = 0,
      offsetY = 0;

    for (let i = 0; i < text.length; i++) {
      const character = text[i];

      if (character === '\n') {
        offsetX = 0;
        offsetY -= line_height;
      } else {
        const glyph = glyphs[character] || glyphs['?'];
        if (!glyph) throw Error(`FontManager: character "${character}" does not exists in font family ${familyName}.`);

        if (glyph.o) {
          const outline = outlines.get(character)!;

          paths.push(this.createPath(outline, scale, offsetX, offsetY));
        }

        offsetX += glyph.ha * scale;
      }
    }

    return paths;
  }

  createPath(outline: string[], scale: number, offsetX: number, offsetY: number): ShapePath {
    const path = new ShapePath();

    const enum Action {
      Move = 'm',
      Line = 'l',
      QuadraticCurve = 'q',
      BezierCurve = 'b',
    }

    for (let i = 0, it = outline.length; i < it; ) {
      const action = outline[i++];

      switch (action) {
        case Action.Move: {
          const x = +outline[i++] * scale + offsetX;
          const y = +outline[i++] * scale + offsetY;
          path.moveTo(x, y);
          break;
        }
        case Action.Line: {
          const x = +outline[i++] * scale + offsetX;
          const y = +outline[i++] * scale + offsetY;
          path.lineTo(x, y);
          break;
        }
        case Action.QuadraticCurve: {
          const cpx = +outline[i++] * scale + offsetX;
          const cpy = +outline[i++] * scale + offsetY;
          const cpx1 = +outline[i++] * scale + offsetX;
          const cpy1 = +outline[i++] * scale + offsetY;
          path.quadraticCurveTo(cpx1, cpy1, cpx, cpy);
          break;
        }
        case Action.BezierCurve: {
          const cpx = +outline[i++] * scale + offsetX;
          const cpy = +outline[i++] * scale + offsetY;
          const cpx1 = +outline[i++] * scale + offsetX;
          const cpy1 = +outline[i++] * scale + offsetY;
          const cpx2 = +outline[i++] * scale + offsetX;
          const cpy2 = +outline[i++] * scale + offsetY;
          path.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, cpx, cpy);
          break;
        }
      }
    }

    return path;
  }
}
