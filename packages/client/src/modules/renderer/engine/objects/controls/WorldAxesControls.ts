import {
  BoxGeometry,
  Camera,
  CanvasTexture,
  Color,
  Entity,
  Euler,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  Quaternion,
  Raycaster,
  Sprite,
  SpriteMaterial,
  Vec2,
  Vec3,
  Vec4,
} from '../../engine.js';
import { Renderer } from '@modules/renderer/engine/renderers/Renderer.js';

const turnRate = 2 * Math.PI;
const dim = 128;
const createAxisMaterial = (color: Color) => new MeshBasicMaterial({ color: color, toneMapped: false });
const red = Color.new(0xff3653);
const green = Color.new(0x8adb00);
const blue = Color.new(0x2c8fff);

const addCircle = (canvas: HTMLCanvasElement, radius: number, color: Color): HTMLCanvasElement => {
  const context = canvas.getContext('2d')!;
  context.beginPath();
  context.arc(32, 32, radius, 0, 2 * Math.PI);
  context.closePath();
  context.fillStyle = color.intoStyle();
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

const createSpriteMaterial = (color: Color, text: string | null = null) => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;

  addCircle(canvas, 16, color);
  if (text) addText(canvas, text);

  return new SpriteMaterial({ map: new CanvasTexture(canvas), toneMapped: false });
};

type AnimateState = {
  position: Vec3;
  rotation: Quaternion;
};

export class WorldAxesControls extends Entity {
  center: Vec3 = Vec3.new();

  radius: number;
  geometry: BoxGeometry = new BoxGeometry(0.8, 0.05, 0.05).translate(0.4, 0, 0);
  axisLines: [posX: Sprite, posY: Sprite, posZ: Sprite, negX: Sprite, negY: Sprite, negZ: Sprite];
  axisMeshes: [xAxis: Mesh, yAxis: Mesh, zAxis: Mesh];
  raycaster: Raycaster = Raycaster.new();
  dummy: Entity = new Entity();
  orthoCamera: OrthographicCamera;
  q1: Quaternion = Quaternion.new();
  q2: Quaternion = Quaternion.new();
  viewport: Vec4 = Vec4.new();
  point: Vec3 = Vec3.new();
  unsubscribeClick: () => void;

  animation: AnimateState | null;

  constructor(
    public camera: Camera,
    public canvas: HTMLCanvasElement,
  ) {
    super();
    const handleClick = this.handleClick.bind(this);
    this.canvas.addEventListener('click', handleClick);
    this.unsubscribeClick = () => this.canvas.removeEventListener('click', handleClick);

    this.orthoCamera = new OrthographicCamera(-2, 2, 2, -2, 0, 4);
    this.orthoCamera.position.set(0, 0, 2);

    const xAxis = new Mesh(this.geometry, createAxisMaterial(red));
    const yAxis = new Mesh(this.geometry, createAxisMaterial(green));
    const zAxis = new Mesh(this.geometry, createAxisMaterial(blue));
    yAxis.setRotationZ(Math.PI / 2);
    zAxis.setRotationY(-Math.PI / 2);

    const posX = new Sprite(createSpriteMaterial(red, 'X'));
    posX.name = '+X';
    posX.position.x = 1;

    const posY = new Sprite(createSpriteMaterial(green, 'Y'));
    posY.name = '+Y';
    posY.position.y = 1;

    const posZ = new Sprite(createSpriteMaterial(blue, 'Z'));
    posZ.name = '+Z';
    posZ.position.z = 1;

    const negX = new Sprite(createSpriteMaterial(red));
    negX.name = '-X';
    negX.position.x = -1;
    negX.scale.setScalar(0.8);

    const negY = new Sprite(createSpriteMaterial(green));
    negY.name = '-Y';
    negY.position.y = -1;
    negY.scale.setScalar(0.8);

    const negZ = new Sprite(createSpriteMaterial(blue));
    negZ.name = '-Z';
    negZ.position.z = -1;
    negZ.scale.setScalar(0.8);

    this.axisMeshes = [xAxis, yAxis, zAxis];
    this.axisLines = [posX, posY, posZ, negX, negY, negZ];

    this.add(...this.axisMeshes, ...this.axisLines);
  }

  findAnimateState(object: Sprite): AnimateState | null {
    const [posX, posY, posZ, negX, negY, negZ] = this.axisLines;

    if (posX === object) {
      return {
        position: Vec3.new(1, 0, 0),
        rotation: Quaternion.fromEuler(new Euler(0, Math.PI * 0.5, 0)),
      };
    } else if (posY === object) {
      return {
        position: Vec3.new(0, 1, 0),
        rotation: Quaternion.fromEuler(new Euler(-Math.PI * 0.5, 0, 0)),
      };
    } else if (posZ === object) {
      return {
        position: Vec3.new(0, 0, 1),
        rotation: Quaternion.fromEuler(new Euler()),
      };
    } else if (negX === object) {
      return {
        position: Vec3.new(-1, 0, 0),
        rotation: Quaternion.fromEuler(new Euler(0, -Math.PI * 0.5, 0)),
      };
    } else if (negY === object) {
      return {
        position: Vec3.new(0, -1, 0),
        rotation: Quaternion.fromEuler(new Euler(Math.PI * 0.5, 0, 0)),
      };
    } else if (negZ === object) {
      return {
        position: Vec3.new(0, 0, -1),
        rotation: Quaternion.fromEuler(new Euler(0, Math.PI, 0)),
      };
    }

    return null;
  }

  render(renderer: Renderer): void {
    const {
      quaternion,
      point,
      axisLines: [posX, posY, posZ, negX, negY, negZ],
    } = this;

    quaternion.from(this.camera.quaternion).invert();
    this.updateMatrixWorld();

    point.set(0, 0, 1);
    point.applyQuaternion(this.camera.quaternion);

    if (point.x >= 0) {
      posX.material.opacity = 1;
      negX.material.opacity = 0.5;
    } else {
      posX.material.opacity = 0.5;
      negX.material.opacity = 1;
    }
    if (point.y >= 0) {
      posY.material.opacity = 1;
      negY.material.opacity = 0.5;
    } else {
      posY.material.opacity = 0.5;
      negY.material.opacity = 1;
    }
    if (point.z >= 0) {
      posZ.material.opacity = 1;
      negZ.material.opacity = 0.5;
    } else {
      posZ.material.opacity = 0.5;
      negZ.material.opacity = 1;
    }

    renderer.clear(false, true, false);
    this.viewport.from(renderer.viewport);
    renderer.viewport.set(this.canvas.offsetWidth - dim, 0, dim, dim);
    renderer.render(this, this.orthoCamera);
    renderer.viewport.set(this.viewport.x, this.viewport.y, this.viewport.z, this.viewport.w);
  }

  handleClick(event: MouseEvent): void {
    if (this.animation) return;

    const { bottom, left, right, top } = this.canvas.getBoundingClientRect();
    const offsetX = left + (this.canvas.offsetWidth - dim);
    const offsetY = top + (this.canvas.offsetHeight - dim);

    this.raycaster.fromCamera(
      Vec2.new(
        ((event.clientX - offsetX) / (right - offsetX)) * 2 - 1,
        -((event.clientY - offsetY) / (bottom - offsetY)) * 2 + 1,
      ),
      this.orthoCamera,
    );

    const intersects = this.raycaster.intersects<Sprite>(this.axisLines);
    if (intersects.length === 0) return;

    this.animation = this.findAnimateState(intersects[0].object);
    if (!this.animation) return;

    this.radius = this.camera.position.distanceTo(this.center);

    this.animation.position.scale(this.radius).add(this.center);

    this.dummy.position.from(this.center);
    this.dummy.lookAt(this.camera.position);
    this.q1.from(this.dummy.quaternion);

    this.dummy.lookAt(this.animation.position);
    this.q2.from(this.dummy.quaternion);
  }

  update(delta: number): void {
    if (!this.animation) return;

    const step = delta * turnRate;
    const { q1, q2 } = this;

    this.q1.rotateTowards(q2, step);

    this.camera.position.set(0, 0, 1).applyQuaternion(q1).scale(this.radius).add(this.center);
    this.camera.quaternion.rotateTowards(this.animation.rotation, step);

    if (q1.angleTo(q2) === 0) this.animation = null;
  }

  dispose(): void {
    this.unsubscribeClick();
  }
}
