import { Color, ColorRepresentation } from '@modules/renderer/engine/math/Color.js';
import { SpriteMaterial } from '@modules/renderer/engine/materials/SpriteMaterial.js';
import { CanvasTexture } from '@modules/renderer/engine/textures/CanvasTexture.js';

const addCircle = (canvas: HTMLCanvasElement, radius: number, color: Color): HTMLCanvasElement => {
  const context = canvas.getContext('2d')!;
  context.beginPath();
  context.arc(32, 32, radius, 0, 2 * Math.PI);
  context.closePath();
  context.fillStyle = color.getStyle();
  context.fill();

  return canvas;
};

const addText = (canvas: HTMLCanvasElement, text: string): HTMLCanvasElement => {
  const context = canvas.getContext('2d')!;
  context.font = '24px Arial';
  context.textAlign = 'center';
  context.fillStyle = '#000000';
  context.fillText(text, 32, 41);

  return canvas;
};

const spriteMaterialBuilder = (color: Color, text: string | null = null) => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;

  addCircle(canvas, 16, color);
  if (text) addText(canvas, text);

  return new SpriteMaterial({ map: new CanvasTexture(canvas), toneMapped: false });
};

export class SpriteMaterialBuilder {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;

  static create(options: Options) {
    return new this(options);
  }

  constructor({ height, width }: Options) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    this.canvas = canvas;
    this.context = canvas.getContext('2d')!;
  }

  addCircle({
    positionX = this.canvas.width / 2,
    positionY = this.canvas.height / 2,
    radius = this.canvas.height / 8,
    color = new Color('white'),
  }: CircleOptions = {}) {
    this.context.beginPath();
    this.context.arc(positionX, positionY, radius, 0, 2 * Math.PI);
    this.context.closePath();

    this.context.fillStyle = new Color(color).getStyle();
    this.context.fill();

    return this;
  }

  addText(
    text: string,
    {
      positionX = this.canvas.width / 2,
      positionY = this.canvas.height / 2,
      font = 'Arial',
      size = 24,
      color = new Color('black'),
    }: TextOptions = {},
  ) {
    this.context.font = `${size}px ${font}`;
    this.context.textAlign = 'center';
    this.context.fillStyle = new Color(color).getStyle();

    const metrics = this.context.measureText(text);
    // center text
    this.context.fillText(text, positionX - metrics.width / 2, positionY + size / 2);

    return this;
  }

  build() {
    return new SpriteMaterial({ map: new CanvasTexture(this.canvas), toneMapped: false });
  }
}

interface Options {
  width: number;
  height: number;
}

interface CircleOptions {
  positionX?: number;
  positionY?: number;
  radius?: number;
  color?: ColorRepresentation;
}

interface TextOptions {
  positionX?: number;
  positionY?: number;
  font?: string;
  size?: number;
  color?: ColorRepresentation;
}
