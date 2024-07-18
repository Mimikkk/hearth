import {
  AnimationMixer,
  Clock,
  PerspectiveCamera,
  PointLight,
  Scene,
  ToneMapping,
  Vec3,
} from '@modules/renderer/engine/engine.js';
import { color, viewportTopLeft } from '@modules/renderer/engine/nodes/Nodes.js';

import { GLTFLoader } from '@modules/renderer/engine/loaders/objects/GLTFLoader/GLTFLoader.js';

import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { ColorMap } from '@modules/renderer/engine/math/Color.js';
import { Const } from '@modules/renderer/engine/math/types.js';

const createCamera = (at: Const<Vec3>) => {
  const camera = new PerspectiveCamera();
  camera.position.from(at);
  camera.lookAt(0, 1, 0);
  return camera;
};
const createScene = () => {
  const scene = new Scene();
  scene.backgroundNode = viewportTopLeft.y.mix(color(ColorMap.beige), color(ColorMap.skyblue));
  return scene;
};
const loadMichelle = async () => {
  const {
    animations: [dance],
    scene: michelle,
  } = await GLTFLoader.loadAsync('resources/models/gltf/Michelle.glb');

  const mixer = new AnimationMixer(michelle);
  const action = mixer.clipAction(dance);
  action.play();

  return { michelle, mixer };
};
const createPointLight = () => {
  const light = new PointLight(0xffffff, 1, 100);
  light.power = 2500;
  return light;
};

const camera = createCamera(Vec3.new(1, 2, 3));
const scene = createScene();

const light = createPointLight();
camera.add(light);
const { michelle, mixer } = await loadMichelle();

scene.add(camera, michelle);

const renderer = await Renderer.create({
  animate(delta) {
    mixer.update(delta);
    renderer.render(scene, camera);
  },
  toneMapping: ToneMapping.Linear,
  toneMappingExposure: 0.4,
});

useWindowResizer(renderer, camera);
