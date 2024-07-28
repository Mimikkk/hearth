import {
  checker,
  color,
  f32,
  MeshStandardNodeMaterial,
  NodeMaterial,
  oscSine,
  output,
  timerLocal,
  toneMapping,
  uv,
  vec3,
  viewportSharedTexture,
  viewportTopLeft,
} from '@modules/renderer/engine/nodes/Nodes.js';
import { GLTFLoader } from '@modules/renderer/engine/loaders/objects/GLTFLoader/GLTFLoader.js';
import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { OrbitControls } from '@modules/renderer/engine/entities/controls/OrbitControls.js';
import {
  AnimationClip,
  AnimationMixer,
  Clock,
  Color,
  Entity,
  Group,
  Mesh,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  SpotLight,
  ToneMapping,
} from '@modules/renderer/engine/engine.js';
import { degreeToRadian } from '@modules/renderer/engine/math/MathUtils.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { Random } from '@modules/renderer/engine/math/random.js';
import { ICamera } from '@modules/renderer/engine/entities/cameras/Camera.js';

const createCamera = () => {
  const camera = new PerspectiveCamera();
  camera.position.set(1, 2, 3);
  camera.lookAt(0, 1, 0);
  return camera;
};
const createScene = () => {
  const scene = new Scene();
  scene.background = Color.new(0x00aacc);
  return scene;
};
const createSpotLight = () => {
  const light = new SpotLight(0xffffff, 1);
  light.power = 2000;
  return light;
};
const useOrbitControls = (camera: ICamera, canvas: HTMLCanvasElement) => {
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 1, 0);
  return controls;
};
const useAnimation = (item: Entity, animations: AnimationClip[]) => {
  const mixer = new AnimationMixer(item);
  const action = mixer.clipAction(animations[0]);
  action.play();

  return mixer;
};
const loadMichelle = async () => {
  const gltf = await GLTFLoader.loadAsync('resources/models/gltf/Michelle.glb');
  const material = gltf.scene.children[0].children[0].material as NodeMaterial;
  material.outputNode = oscSine(timerLocal(0.1)).mix(output, output.add(0.1).posterize(4).mul(2));

  return { michelle: gltf.scene, animations: gltf.animations };
};

const camera = createCamera();
const scene = createScene();
const light = createSpotLight();
const clock = Clock.new();
const { michelle, animations } = await loadMichelle();

const mixer = useAnimation(michelle, animations);
const geometry = new SphereGeometry(0.3, 32, 16);

const portals = new Group();
const createPortal = (backdropNode: Node, backdropAlphaNode?: Node) => {
  const distance = 1;
  const id = portals.children.length;
  const rotation = degreeToRadian(id * 45);

  const material = new MeshStandardNodeMaterial({ color: Random.color() });
  material.roughnessNode = f32(0.2);
  material.metalnessNode = f32(0);
  material.backdropNode = backdropNode;
  material.backdropAlphaNode = backdropAlphaNode;
  material.transparent = true;

  const mesh = new Mesh(geometry, material);
  mesh.position.set(Math.cos(rotation) * distance, 1, Math.sin(rotation) * distance);

  return mesh;
};
portals.add(createPortal(viewportSharedTexture().bgr.hue(oscSine().mul(Math.PI))));
portals.add(createPortal(viewportSharedTexture().rgb.oneMinus()));
portals.add(createPortal(viewportSharedTexture().rgb.saturation(0)));
portals.add(createPortal(viewportSharedTexture().rgb.saturation(10), oscSine()));
portals.add(createPortal(viewportSharedTexture().rgb.overlay(checker(uv().mul(10)))));
portals.add(createPortal(viewportSharedTexture(viewportTopLeft.mul(40).floor().div(40))));
portals.add(createPortal(viewportSharedTexture(viewportTopLeft.mul(80).floor().div(80)).add(color(0x0033ff))));
portals.add(createPortal(vec3(0, 0, viewportSharedTexture().b)));
scene.add(michelle);
scene.add(portals);
camera.add(light);
scene.add(camera);

const renderer = await Hearth.as({
  toneMappingNode: toneMapping(ToneMapping.Linear, 0.15),
  async animate() {
    const delta = clock.tick();
    controls.update(delta);

    if (mixer) mixer.update(delta);
    portals.rotateY(delta * 0.5);

    await renderer.render(scene, camera);
  },
});
const controls = useOrbitControls(camera, renderer.parameters.canvas);
useWindowResizer(renderer, camera);
