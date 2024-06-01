import { FileLoader, Loader } from '../../threejs/Three.js';
import * as opentype from 'opentype.js';

export class TTFLoader<TUrl extends string = string> extends Loader {
  responseType: 'arraybuffer' = 'arraybuffer';
  reversed: boolean;

  constructor(options?: TTFLoader.Options) {
    super(options);

    this.reversed = options?.reversed ?? false;
  }

  load(url: TUrl, handlers?: Loader.Handlers<any>) {
    FileLoader.load(url, this, {
      onLoad: this.createOnLoad(url, handlers?.onLoad, handlers?.onError),
      onProgress: handlers?.onProgress,
      onError: handlers?.onError,
    });
  }

  parse(arraybuffer: ArrayBuffer) {
    function convert(font: any, reversed: boolean) {
      const round = Math.round;

      const glyphs: Record<string, any> = {};
      const scale = 100000 / ((font.unitsPerEm || 2048) * 72);

      const glyphIndexMap = font.encoding.cmap.glyphIndexMap;
      const unicodes = Object.keys(glyphIndexMap);

      for (let i = 0; i < unicodes.length; i++) {
        const unicode = unicodes[i];
        const glyph = font.glyphs.glyphs[glyphIndexMap[unicode]];

        if (unicode !== undefined) {
          const token = {
            ha: round(glyph.advanceWidth * scale),
            x_min: round(glyph.xMin * scale),
            x_max: round(glyph.xMax * scale),
            o: '',
          };

          if (reversed) {
            glyph.path.commands = reverseCommands(glyph.path.commands);
          }

          glyph.path.commands.forEach(function (command: any) {
            if (command.type.toLowerCase() === 'c') {
              command.type = 'b';
            }

            token.o += command.type.toLowerCase() + ' ';

            if (command.x !== undefined && command.y !== undefined) {
              token.o += round(command.x * scale) + ' ' + round(command.y * scale) + ' ';
            }

            if (command.x1 !== undefined && command.y1 !== undefined) {
              token.o += round(command.x1 * scale) + ' ' + round(command.y1 * scale) + ' ';
            }

            if (command.x2 !== undefined && command.y2 !== undefined) {
              token.o += round(command.x2 * scale) + ' ' + round(command.y2 * scale) + ' ';
            }
          });

          glyphs[String.fromCodePoint(glyph.unicode)] = token;
        }
      }

      return {
        glyphs: glyphs,
        familyName: font.getEnglishName('fullName'),
        ascender: round(font.ascender * scale),
        descender: round(font.descender * scale),
        underlinePosition: font.tables.post.underlinePosition,
        underlineThickness: font.tables.post.underlineThickness,
        boundingBox: {
          xMin: font.tables.head.xMin,
          xMax: font.tables.head.xMax,
          yMin: font.tables.head.yMin,
          yMax: font.tables.head.yMax,
        },
        resolution: 1000,
        original_font_information: font.tables.name,
      };
    }

    function reverseCommands(commands: any) {
      const paths: any[] = [];
      let path;

      commands.forEach(function (c: any) {
        if (c.type.toLowerCase() === 'm') {
          path = [c];
          paths.push(path);
        } else if (c.type.toLowerCase() !== 'z') {
          path.push(c);
        }
      });

      const reversed: any[] = [];

      paths.forEach(function (p) {
        const result = {
          type: 'm',
          x: p[p.length - 1].x,
          y: p[p.length - 1].y,
        };

        reversed.push(result);

        for (let i = p.length - 1; i > 0; i--) {
          const command = p[i];
          const result: {
            type: string;
            x: number;
            y: number;
            x1?: number;
            y1?: number;
            x2?: number;
            y2?: number;
          } = { type: command.type, x: p[i - 1].x, y: p[i - 1].y };

          if (command.x2 !== undefined && command.y2 !== undefined) {
            result.x1 = command.x2;
            result.y1 = command.y2;
            result.x2 = command.x1;
            result.y2 = command.y1;
          } else if (command.x1 !== undefined && command.y1 !== undefined) {
            result.x1 = command.x1;
            result.y1 = command.y1;
          }

          reversed.push(result);
        }
      });

      return reversed;
    }

    return convert(opentype.parse(arraybuffer), this.reversed);
  }

  createOnLoad(url: TUrl, onLoad: undefined | Loader.OnLoad<any>, onError: Loader.OnError = console.error) {
    return (buffer: ArrayBuffer) => {
      try {
        onLoad?.(this.parse(buffer));
      } catch (e) {
        onError(e);
        this.manager.itemError(url);
      }
    };
  }
}

export namespace TTFLoader {
  export interface Options extends Pick<Loader.Options, 'manager' | 'path' | 'requestHeader' | 'withCredentials'> {
    reversed?: boolean;
  }
}
