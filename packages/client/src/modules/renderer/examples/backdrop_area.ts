import {
  checker,
  color,
  depth,
  depthTexture,
  MeshBasicNodeMaterial,
  modelScale,
  toneMapping,
  uv,
  viewportMipTexture,
  viewportSharedTexture,
  viewportTopLeft,
} from '@modules/renderer/engine/nodes/Nodes.js';

import { GLTFLoader } from '@modules/renderer/engine/loaders/objects/GLTFLoader/GLTFLoader.js';

import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';

import { OrbitControls } from '@modules/renderer/engine/controls/OrbitControls.js';
import {
  AnimationMixer,
  BoxGeometry,
  Clock,
  Color,
  Mesh,
  PerspectiveCamera,
  Scene,
  Side,
  ToneMapping,
} from '@modules/renderer/engine/engine.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { UI } from '@mimi/ui';

const createCamera = () => {
  const camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.25, 25);
  camera.position.set(3, 2, 3);
  camera.lookAt(0, 1, 0);

  return camera;
};
const createScene = () => {
  const scene = new Scene();
  scene.background = new Color(0x333333);

  return scene;
};
const loadMichelle = async () => {
  const gltf = await GLTFLoader.loadAsync('resources/models/gltf/Michelle.glb');
  const object = gltf.scene;
  const mixer = new AnimationMixer(object);

  const action = mixer.clipAction(gltf.animations[0]);
  action.play();

  return { object, mixer };
};
const createRenderer = async (animate: () => void) => {
  const renderer = await Renderer.create({ antialias: false });
  renderer._animation.loop = animate;
  renderer.parameters.toneMappingNode = toneMapping(ToneMapping.Linear, 0.15);
  document.body.appendChild(renderer.parameters.canvas);

  return renderer;
};
const useOrbitControls = (canvas: HTMLCanvasElement) => {
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 1, 0);
  controls.update();
};
const createBox = () => {
  const box = new Mesh(new BoxGeometry(2, 2, 2), volumeMaterial);
  box.position.set(0, 1, 0);
  box.material = bicubicMaterial;
  return box;
};
const createFloor = () => {
  const floor = new Mesh(new BoxGeometry(1.99, 0.01, 1.99), new MeshBasicNodeMaterial({ color: 0x333333 }));
  floor.position.set(0, 0, 0);
  return floor;
};
const useUi = () => {
  type MaterialType = 'blurred' | 'volume' | 'depth' | 'bicubic' | 'pixel';
  const materials = {
    blurred: blurredBlur,
    volume: volumeMaterial,
    depth: depthMaterial,
    bicubic: bicubicMaterial,
    pixel: pixelMaterial,
  };

  UI.create<{
    value: boolean;
    scale: { x: number; z: number };
    material: MaterialType;
  }>('controls', {
    value: false,
    scale: { x: 1, z: 1 },
    material: 'bicubic',
  })
    .option<MaterialType>(
      'material',
      'Material',
      {
        blurred: 'Blurred',
        volume: 'Volume',
        depth: 'Depth',
        bicubic: 'Bicubic',
        pixel: 'Pixel',
      },
      value => {
        box.material = materials[value];
      },
    )
    .number('scale.x', 'Scale X', 0.1, 2, 0.01, value => {
      box.scale.x = value;
      floor.scale.x = value;
    })
    .number('scale.z', 'Scale Z', 0.1, 2, 0.01, value => {
      box.scale.z = value;
      floor.scale.z = value;
    });
};

const depthDistance = depthTexture().distance(depth);
const depthAlphaNode = depthDistance.oneMinus().smoothstep(0.9, 2).mul(20).saturate();
const depthBlurred = viewportMipTexture().bicubic(
  depthDistance
    .smoothstep(0, 0.6)
    .mul(40 * 5)
    .clamp(0, 5),
);

const blurredBlur = new MeshBasicNodeMaterial();
blurredBlur.backdropNode = depthBlurred.add(depthAlphaNode.mix(color(0x0066ff), 0));
blurredBlur.transparent = true;
blurredBlur.side = Side.Double;

const volumeMaterial = new MeshBasicNodeMaterial();
volumeMaterial.colorNode = color(0x0066ff);
volumeMaterial.backdropNode = viewportSharedTexture();
volumeMaterial.backdropAlphaNode = depthAlphaNode;
volumeMaterial.transparent = true;
volumeMaterial.side = Side.Double;

const depthMaterial = new MeshBasicNodeMaterial();
depthMaterial.backdropNode = depthAlphaNode;
depthMaterial.transparent = true;
depthMaterial.side = Side.Double;

const bicubicMaterial = new MeshBasicNodeMaterial();
bicubicMaterial.backdropNode = viewportMipTexture().bicubic(5);
bicubicMaterial.backdropAlphaNode = checker(uv().mul(3).mul(modelScale.xy));
bicubicMaterial.opacityNode = bicubicMaterial.backdropAlphaNode;
bicubicMaterial.transparent = true;
bicubicMaterial.side = Side.Double;

const pixelMaterial = new MeshBasicNodeMaterial();
pixelMaterial.backdropNode = viewportSharedTexture(viewportTopLeft.mul(100).floor().div(100));
pixelMaterial.transparent = true;

const camera = createCamera();
const scene = createScene();
const clock = new Clock();
const { object, mixer } = await loadMichelle();

const box = createBox();
const floor = createFloor();
scene.add(object, box, floor);

const renderer = await createRenderer(() => {
  const delta = clock.getDelta();

  if (mixer) mixer.update(delta);

  renderer.render(scene, camera);
});

useUi();
useOrbitControls(renderer.parameters.canvas);
useWindowResizer(renderer, camera);
