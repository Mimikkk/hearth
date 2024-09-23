import * as Engine from '@mimi/hearth';
import { PerspectiveCamera, Scene } from '@mimi/hearth';

import { FontLoader } from '@mimi/hearth';
import { TextGeometry } from '@mimi/hearth';

import { Hearth } from '@mimi/hearth';
import { ColorRepresentation } from '@mimi/hearth';
import { clamp } from 'lodash-es';
import { FontManager } from '@mimi/hearth';

let screensplit = 0.25;
let screensplit_right = 0;

const mouse = [0.5, 0.5];
let position = -100;
const zoom = {
  minSpeed: 0.015,
  speed: 0.015,
};

let container!: HTMLDivElement;
let border!: HTMLDivElement;
let scene!: Scene;
let normal!: HTMLDivElement;
let logarithmic!: HTMLDivElement;

let objects!: Views;

const descriptors = [
  { size: 0.01, scale: 0.0001, label: 'microscopic (1µm)' },
  { size: 0.01, scale: 0.1, label: 'minuscule (1mm)' },
  { size: 0.01, scale: 1.0, label: 'tiny (1cm)' },
  { size: 1, scale: 1.0, label: 'child-sized (1m)' },
  { size: 10, scale: 1.0, label: 'tree-sized (10m)' },
  { size: 100, scale: 1.0, label: 'building-sized (100m)' },
  { size: 1000, scale: 1.0, label: 'medium (1km)' },
  { size: 10000, scale: 1.0, label: 'city-sized (10km)' },
  { size: 3400000, scale: 1.0, label: 'moon-sized (3,400 Km)' },
  { size: 12000000, scale: 1.0, label: 'planet-sized (12,000 km)' },
  { size: 1400000000, scale: 1.0, label: 'sun-sized (1,400,000 km)' },
  { size: 7.47e12, scale: 1.0, label: 'solar system-sized (50Au)' },
  { size: 9.4605284e15, scale: 1.0, label: 'gargantuan (1 light year)' },
  { size: 3.08567758e16, scale: 1.0, label: 'ludicrous (1 parsec)' },
  { size: 1e19, scale: 1.0, label: 'mind boggling (1000 light years)' },
];

interface Views {
  normal: CameraView;
  logarithmic: CameraView;
}

interface CameraView {
  container: HTMLDivElement;
  hearth: Hearth;
  camera: PerspectiveCamera;
}

const createViews = (normal: CameraView, logarithmic: CameraView): Views => ({ normal, logarithmic });

const createCameraView = async (container: HTMLDivElement, type: 'logarithmic' | 'normal'): Promise<CameraView> => {
  const { innerWidth: width, innerHeight: height } = window;
  const Near = 1e-6;
  const Far = 1e27;

  const camera = new Engine.PerspectiveCamera(50, (screensplit * width) / height, Near, Far);

  const hearth = await Hearth.as({ logarithmicDepthBuffer: type === 'logarithmic' });
  hearth.setPixelRatio(window.devicePixelRatio);
  hearth.setSize(width / 2, height);

  hearth.parameters.canvas.style.position = 'relative';
  hearth.parameters.canvas.id = `renderer_${type}`;
  container.appendChild(hearth.parameters.canvas);
  await hearth.init();

  return { container, hearth, camera } as const;
};

const updateRenderers = () => {
  const { innerWidth: width, innerHeight: height } = window;

  screensplit_right = 1 - screensplit;

  objects.normal.hearth.setSize(screensplit * width, height);
  objects.normal.camera.aspect = (screensplit * width) / height;
  objects.normal.camera.updateProjectionMatrix();
  objects.normal.camera.setViewOffset(width, height, 0, 0, width * screensplit, height);
  objects.normal.container.style.width = screensplit * 100 + '%';

  objects.logarithmic.hearth.setSize(screensplit_right * width, height);
  objects.logarithmic.camera.aspect = (screensplit_right * width) / height;
  objects.logarithmic.camera.updateProjectionMatrix();
  objects.logarithmic.camera.setViewOffset(width, height, width * screensplit, 0, width * screensplit_right, height);
  objects.logarithmic.container.style.width = screensplit_right * 100 + '%';

  border.style.left = screensplit * 100 + '%';
};

const onResize = () => {
  updateRenderers();
};

const onMove = (ev: MouseEvent) => {
  mouse[0] = ev.clientX / window.innerWidth;
  mouse[1] = ev.clientY / window.innerHeight;
};

const onWheel = (ev: WheelEvent) => {
  const amount = ev.deltaY;
  if (amount === 0) return;
  const dir = amount / Math.abs(amount);
  zoom.speed = dir / 10;
  zoom.minSpeed = 0.001;
};

const createBorderEvents = (border: HTMLDivElement) => {
  const onBorderPointerMove = (ev: PointerEvent) => {
    screensplit = clamp(ev.clientX / window.innerWidth, 0.05, 0.95);
  };

  const onBorderPointerUp = () => {
    window.removeEventListener('pointermove', onBorderPointerMove);
    window.removeEventListener('pointerup', onBorderPointerUp);
  };

  function onUp() {
    window.addEventListener('pointermove', onBorderPointerMove);
    window.addEventListener('pointerup', onBorderPointerUp);
  }

  border.addEventListener('pointerdown', onUp);
};

const createScene = (font: FontManager): Scene => {
  const scene = new Engine.Scene();

  scene.add(new Engine.AmbientLight(0x777777));

  const light = new Engine.DirectionalLight(0xffffff, 3);
  light.position.set(100, 100, 100);
  scene.add(light);

  const materialargs: {
    color: ColorRepresentation;
    specular: ColorRepresentation;
    shininess: number;
    emissive: ColorRepresentation;
  } = {
    color: 0xffffff,
    specular: 0x050505,
    shininess: 50,
    emissive: 0x000000,
  };

  const geometry = new Engine.SphereGeometry(0.5, 24, 12);

  for (let i = 0; i < descriptors.length; i++) {
    const scale = descriptors[i].scale || 1;

    const labelgeo = new TextGeometry(descriptors[i].label, {
      font: font,
      size: descriptors[i].size,
      depth: descriptors[i].size / 2,
    });

    labelgeo.calcBoundSphere();

    labelgeo.translate(-labelgeo.boundSphere!.radius, 0, 0);

    materialargs.color = new Engine.Color().setHSL(Math.random(), 0.5, 0.5);

    const material = new Engine.MeshPhongMaterial(materialargs);

    const group = new Engine.Group();
    group.position.z = -descriptors[i].size * scale;
    scene.add(group);

    const textmesh = new Engine.Mesh(labelgeo, material);
    textmesh.scale.set(scale, scale, scale);
    textmesh.position.z = -descriptors[i].size * scale;
    textmesh.position.y = (descriptors[i].size / 4) * scale;
    group.add(textmesh);

    const dotmesh = new Engine.Mesh(geometry, material);
    dotmesh.position.y = (-descriptors[i].size / 4) * scale;
    dotmesh.scale.scale(descriptors[i].size * scale);
    group.add(dotmesh);
  }

  return scene;
};

const recalculateZoom = () => {
  const min = descriptors[0].size ** 2;
  const max = descriptors[descriptors.length - 1].size ** 2 * 100;

  const value = clamp(Math.pow(Math.E, position), min, max);
  position = Math.log(value);

  let damp = Math.abs(zoom.speed) > zoom.minSpeed ? 0.95 : 1.0;
  if ((value == min && zoom.speed < 0) || (value == max && zoom.speed > 0)) damp = 0.85;

  position += zoom.speed;
  zoom.speed *= damp;

  return value;
};

const animate = () => {
  requestAnimationFrame(animate);
  const zoom = recalculateZoom();

  objects.normal.camera.position.x = Math.sin(0.5 * Math.PI * (mouse[0] - 0.5)) * zoom;
  objects.normal.camera.position.y = Math.sin(0.25 * Math.PI * (mouse[1] - 0.5)) * zoom;
  objects.normal.camera.position.z = Math.cos(0.5 * Math.PI * (mouse[0] - 0.5)) * zoom;
  objects.normal.camera.lookAt(scene.position);

  objects.logarithmic.camera.position.from(objects.normal.camera.position);
  objects.logarithmic.camera.quaternion.from(objects.normal.camera.quaternion);

  if (screensplit_right != 1 - screensplit) {
    updateRenderers();
  }

  objects.normal.hearth.render(scene, objects.normal.camera);
  objects.logarithmic.hearth.render(scene, objects.logarithmic.camera);
};

const init = async () => {
  container = document.getElementById('container') as HTMLDivElement;
  normal = document.getElementById('normal') as HTMLDivElement;
  logarithmic = document.getElementById('logarithmic') as HTMLDivElement;
  border = document.getElementById('border') as HTMLDivElement;

  const [font, normalView, logarithmicView] = await Promise.all([
    FontLoader.loadAsync('resources/fonts/helvetiker_regular.typeface.json'),
    createCameraView(normal, 'normal'),
    createCameraView(logarithmic, 'logarithmic'),
  ]);
  scene = createScene(FontManager.create(font));
  objects = createViews(normalView, logarithmicView);

  createBorderEvents(border);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('resize', onResize);
  window.addEventListener('wheel', onWheel);

  animate();
};

await init();
