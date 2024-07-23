import { color, MeshStandardNodeMaterial, normalWorld } from '@modules/renderer/engine/nodes/Nodes.js';
import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import {
  Camera,
  CameraVisualizer,
  Clock,
  Color,
  Group,
  Mesh,
  OrthographicCamera,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  SpotLight,
  Sprite,
} from '@modules/renderer/engine/engine.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { f32 } from 'three/examples/jsm/nodes/shadernode/ShaderNode.js';
import { UI } from '@mimi/ui';
import { OrbitControls } from '@modules/renderer/engine/controls/OrbitControls.js';
import { SpriteMaterialBuilder } from '@modules/renderer/engine/materials/SpriteMaterialBuilder.js';

const createCamera = () => {
  const perspectiveCamera = new PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 100);
  perspectiveCamera.setPosition(0, 0, 3);
  perspectiveCamera.lookAt(0, 0, 0);

  const frustumCamera = new OrthographicCamera(-1, 1, 1, -1, 1, 6);
  frustumCamera.position.set(0, 0, -3);
  frustumCamera.lookAt(0, 0, 0);

  return { perspectiveCamera, frustumCamera };
};
const createScene = () => {
  const scene = new Scene();
  scene.background = Color.new(0x00aacc);
  scene.backgroundNode = normalWorld.y.mix(color(0x0066ff), color(0xff0066));
  return scene;
};
const createLight = () => new SpotLight(0xffffff, 10);
const createRenderer = async (onAnimate: () => void) => {
  const renderer = await Renderer.create();
  renderer.animation.loop = onAnimate;
  document.body.append(renderer.parameters.canvas);

  return renderer;
};
const useOrbitControls = (canvas: HTMLCanvasElement) => {
  const controls = new OrbitControls(state.camera, canvas);
  controls.minDistance = 1;
  controls.maxDistance = 10;
  controls.maxPolarAngle = Math.PI * 0.9;
  controls.target.set(0, 0.2, 0);
  controls.update();

  return controls;
};

const { perspectiveCamera, frustumCamera } = createCamera();
const state = <{ camera: PerspectiveCamera | OrthographicCamera }>{ camera: perspectiveCamera };

const scene = createScene();
const light = createLight();
const clock = new Clock();
const points = new Group();
const spheres = new Group();

const geometry = new SphereGeometry({ radius: 0.25, widthSegments: 32, heightSegments: 24 });

const smb = SpriteMaterialBuilder.create({ height: 256, width: 256 }).addCircle({ radius: 128 }).addText('+');

const sprites = new Group();
const createSphere = (x: number, y: number, z: number) => {
  const material = new MeshStandardNodeMaterial({ color: Math.random() * 0xffffff });
  material.roughnessNode = f32(0.8);
  material.metalnessNode = f32(0.2);

  const mesh = new Mesh(geometry, material);

  const sprite = new Sprite(smb.build());
  sprites.add(sprite);

  mesh.position.set(x, y, z);

  return mesh;
};

points.add(createSphere(0, 0, 3));
points.add(createSphere(0, 0, -3));
points.add(createSphere(2.5, 1.5, 0));

spheres.add(createSphere(0, 0, 0));
spheres.add(createSphere(1, 0, 0));
spheres.add(createSphere(0, 1, 0));
spheres.add(createSphere(1, 1, 0));
spheres.add(createSphere(-1, 0, 0));
spheres.add(createSphere(0, -1, 0));
spheres.add(createSphere(-1, -1, 0));
spheres.add(createSphere(-1, 1, 0));
spheres.add(createSphere(1, -1, 0));

const frustumVisualizer = new CameraVisualizer(frustumCamera);
perspectiveCamera.add(light);
scene.add(frustumVisualizer, frustumCamera, perspectiveCamera, sprites, spheres, points);

const renderer = await createRenderer(() => {
  spheres.rotateZ(clock.tick());

  controls.update();
  renderer.render(scene, state.camera);
});

const controls = useOrbitControls(renderer.parameters.canvas);
useWindowResizer.updateSize(renderer, state.camera);
useWindowResizer(renderer, state.camera);

UI.create<{ camera: Camera }>('Controls', state)
  .action('Switch camera', s => {
    s.camera = s.camera === perspectiveCamera ? frustumCamera : perspectiveCamera;
    controls.enabled = s.camera === perspectiveCamera;

    useWindowResizer.updateSize(renderer, s.camera);
  })
  .action('Reset camera position', () => {
    perspectiveCamera.position.set(0, 0, 3);
    perspectiveCamera.lookAt(0, 0, 0);

    frustumCamera.position.set(0, 0, 3);
    frustumCamera.lookAt(0, 0, 0);
  });
