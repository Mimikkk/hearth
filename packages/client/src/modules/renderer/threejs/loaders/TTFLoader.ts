import * as opentype from 'opentype.js';
import { FileLoader, FileResponseType } from '@modules/renderer/threejs/loaders/FileLoader.js';
import { Configurable, ConfigurableConstructor, LoaderAsync } from '@modules/renderer/threejs/loaders/types.js';

const parse = (arraybuffer: ArrayBuffer, { reversed }: Configuration) => {
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

  return convert(opentype.parse(arraybuffer), reversed);
};

export const TTFLoader = class<TData, TUrl extends string = string>
  implements Configurable<Configuration>, LoaderAsync<any, TUrl>
{
  configuration: Configuration;

  static configure(options?: Options): Configuration {
    return {
      headers: options?.headers,
      credentials: options?.credentials ?? 'same-origin',
      responseType: FileResponseType.Buffer,
      reversed: options?.reversed ?? false,
    };
  }

  constructor(options?: Options) {
    this.configuration = TTFLoader.configure(options);
  }

  async loadAsync<T extends TData, E = unknown>(url: TUrl, handlers?: LoaderAsync.Handlers<E>): Promise<T> {
    const buffer = await FileLoader.loadAsync(url, this.configuration, handlers);

    return parse(buffer, this.configuration) as T;
  }
} satisfies ConfigurableConstructor<Options, Configuration>;

export namespace TTFLoader {
  export interface Options extends Omit<FileLoader.Options, 'responseType'> {
    reversed?: boolean;
  }

  export interface Configuration extends Omit<FileLoader.Configuration, 'responseType'> {
    responseType: FileResponseType.Buffer;
    reversed: boolean;
  }
}
type Options = TTFLoader.Options;
type Configuration = TTFLoader.Configuration;
