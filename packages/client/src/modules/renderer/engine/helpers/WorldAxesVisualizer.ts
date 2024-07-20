import {
  BoxGeometry,
  Camera,
  CanvasTexture,
  Color,
  Euler,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  OrthographicCamera,
  Quaternion,
  Raycaster,
  Sprite,
  SpriteMaterial,
  Vector2,
  Vector3,
  Vector4,
} from '../engine.js';
import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';

const turnRate = 2 * Math.PI;
const dim = 128;
const createAxisMaterial = (color: Color) => new MeshBasicMaterial({ color: color, toneMapped: false });
const red = new Color('#ff3653');
const green = new Color('#8adb00');
const blue = new Color('#2c8fff');

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

const createSpriteMaterial = (color: Color, text: string | null = null) => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;

  addCircle(canvas, 16, color);
  if (text) addText(canvas, text);

  return new SpriteMaterial({ map: new CanvasTexture(canvas), toneMapped: false });
};

type AnimateState = {
  position: Vector3;
  rotation: Quaternion;
};

export class WorldAxesVisualizer extends Object3D {
  center: Vector3 = new Vector3();

  radius: number;
  geometry: BoxGeometry = new BoxGeometry(0.8, 0.05, 0.05).translate(0.4, 0, 0);
  axisLines: [posX: Sprite, posY: Sprite, posZ: Sprite, negX: Sprite, negY: Sprite, negZ: Sprite];
  axisMeshes: [xAxis: Mesh, yAxis: Mesh, zAxis: Mesh];
  raycaster: Raycaster = new Raycaster();
  dummy: Object3D = new Object3D();
  orthoCamera: OrthographicCamera;
  q1: Quaternion = new Quaternion();
  q2: Quaternion = new Quaternion();
  viewport: Vector4 = new Vector4();
  point: Vector3 = new Vector3();
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
    yAxis.rotateZ(Math.PI / 2);
    zAxis.rotateY(-Math.PI / 2);

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
        position: new Vector3(1, 0, 0),
        rotation: new Quaternion().setFromEuler(new Euler(0, Math.PI * 0.5, 0)),
      };
    } else if (posY === object) {
      return {
        position: new Vector3(0, 1, 0),
        rotation: new Quaternion().setFromEuler(new Euler(-Math.PI * 0.5, 0, 0)),
      };
    } else if (posZ === object) {
      return {
        position: new Vector3(0, 0, 1),
        rotation: new Quaternion().setFromEuler(new Euler()),
      };
    } else if (negX === object) {
      return {
        position: new Vector3(-1, 0, 0),
        rotation: new Quaternion().setFromEuler(new Euler(0, -Math.PI * 0.5, 0)),
      };
    } else if (negY === object) {
      return {
        position: new Vector3(0, -1, 0),
        rotation: new Quaternion().setFromEuler(new Euler(Math.PI * 0.5, 0, 0)),
      };
    } else if (negZ === object) {
      return {
        position: new Vector3(0, 0, -1),
        rotation: new Quaternion().setFromEuler(new Euler(0, Math.PI, 0)),
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

    quaternion.copy(this.camera.quaternion).invert();
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

    renderer.clearDepth();
    renderer.getViewport(this.viewport);
    renderer.setViewport(this.canvas.offsetWidth - dim, 0, dim, dim);
    renderer.render(this, this.orthoCamera);
    renderer.setViewport(this.viewport.x, this.viewport.y, this.viewport.z, this.viewport.w);
  }

  handleClick(event: MouseEvent): void {
    if (this.animation) return;

    const { bottom, left, right, top } = this.canvas.getBoundingClientRect();
    const offsetX = left + (this.canvas.offsetWidth - dim);
    const offsetY = top + (this.canvas.offsetHeight - dim);

    this.raycaster.setFromCamera(
      new Vector2(
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

    this.animation.position.multiplyScalar(this.radius).add(this.center);

    this.dummy.position.copy(this.center);
    this.dummy.lookAt(this.camera.position);
    this.q1.copy(this.dummy.quaternion);

    this.dummy.lookAt(this.animation.position);
    this.q2.copy(this.dummy.quaternion);
  }

  update(delta: number): void {
    if (!this.animation) return;

    const step = delta * turnRate;
    const { q1, q2 } = this;

    this.q1.rotateTowards(q2, step);

    this.camera.position.set(0, 0, 1).applyQuaternion(q1).multiplyScalar(this.radius).add(this.center);
    this.camera.quaternion.rotateTowards(this.animation.rotation, step);

    if (q1.angleTo(q2) === 0) this.animation = null;
  }

  dispose(): void {
    this.unsubscribeClick();

    this.geometry.dispose();
    const [xAxis, yAxis, zAxis] = this.axisMeshes;
    xAxis.material.dispose();
    yAxis.material.dispose();
    zAxis.material.dispose();

    const [posX, posY, posZ, negX, negY, negZ] = this.axisLines;
    posX.material.map?.dispose();
    posX.material.dispose();
    posY.material.map?.dispose();
    posY.material.dispose();
    posZ.material.map?.dispose();
    posZ.material.dispose();
    negX.material.map?.dispose();
    negX.material.dispose();
    negY.material.map?.dispose();
    negY.material.dispose();
    negZ.material.map?.dispose();
    negZ.material.dispose();
  }
}
