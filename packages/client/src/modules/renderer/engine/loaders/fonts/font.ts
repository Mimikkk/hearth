export interface Glyph {
  ha: number;
  x_min: number;
  x_max: number;
  o?: string;
}

export interface Font {
  familyName: string;
  resolution: number;
  underlineThickness: number;
  underlinePosition: number;
  boundBox: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  };
  ascender: number;
  descender: number;
  glyphs: Record<string, Glyph>;
  original_font_information: any;
}
