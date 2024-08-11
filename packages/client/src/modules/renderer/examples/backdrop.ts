import {
  checker,
  color,
  f32,
  MeshStandardNodeMaterial,
  Node,
  oscSine,
  positionLocal,
  toneMapping,
  uv,
  vec3,
  viewportSharedTexture,
  viewportTopLeft,
} from '@modules/renderer/engine/nodes/nodes.js';
import {
  AnimationClip,
  AnimationMixer,
  Clock,
  Color,
  CylinderGeometry,
  Entity,
  GLTFLoader,
  Group,
  Hearth,
  Mesh,
  OrbitControls,
  PerspectiveCamera,
  Random,
  Scene,
  SphereGeometry,
  SpotLight,
  ToneMapping,
  Vec3,
} from '@modules/renderer/engine/engine.js';
import { degreeToRadian } from '@modules/renderer/engine/math/MathUtils.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

const createCamera = () => {
  const camera = new PerspectiveCamera();
  camera.position.set(1, 2, 3);
  camera.lookAt(0, 1, 0);
  return camera;
};
const createScene = () => {
  const scene = new Scene();
  scene.backgroundNode = positionLocal.y.mix(color(0xffaa00), color(0x00aaff)).mul(5);

  return scene;
};
const createSpotLight = () => {
  const light = new SpotLight(0xffffff);
  light.power = 5000;
  return light;
};
const useAnimation = (item: Entity, animations: AnimationClip[]) => {
  const mixer = new AnimationMixer(item);
  const action = mixer.clipAction(animations[0]);
  action.play();

  return mixer;
};
const createPortals = () => {
  const sphere = new SphereGeometry(0.3, 32, 16);
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

    const mesh = new Mesh(sphere, material);
    mesh.position.set(Math.cos(rotation) * distance, 1, Math.sin(rotation) * distance);

    return mesh;
  };

  const portals = new Group();
  portals.add(createPortal(viewportSharedTexture().bgr.hue(oscSine().mul(Math.PI))));
  portals.add(createPortal(viewportSharedTexture().rgb.oneMinus()));
  portals.add(createPortal(viewportSharedTexture().rgb.saturation(0)));
  portals.add(createPortal(viewportSharedTexture().rgb.saturation(10), oscSine()));
  portals.add(createPortal(viewportSharedTexture().rgb.overlay(checker(uv().mul(10)))));
  portals.add(createPortal(viewportSharedTexture(viewportTopLeft.mul(40).floor().div(40))));
  portals.add(createPortal(viewportSharedTexture(viewportTopLeft.mul(80).floor().div(80)).add(color(0x0033ff))));
  portals.add(createPortal(vec3(0, 0, viewportSharedTexture().b)));

  return portals;
};
const createFloor = () => {
  const geometry = new CylinderGeometry(1, 2, 1, 64);
  const material = new MeshStandardNodeMaterial({ color: new Color(0x000f09) });
  return new Mesh(geometry, material).translateY(-0.5);
};
const loadMichelle = async () => {
  const gltf = await GLTFLoader.loadAsync('resources/models/gltf/Michelle.glb');

  return { michelle: gltf.scene, animations: gltf.animations };
};

const floor = createFloor();
const camera = createCamera().add(createSpotLight());

const { michelle, animations } = await loadMichelle();

const mixer = useAnimation(michelle, animations);
const portals = createPortals();

const scene = createScene().add(michelle, portals, floor, camera);

const clock = Clock.new();
const hearth = await Hearth.as({
  async animate() {
    const delta = clock.tick();

    if (mixer) mixer.update(delta);
    portals.rotateY(delta * 0.5);

    await hearth.render(scene, camera);
  },
  toneMappingNode: toneMapping(ToneMapping.ACESFilmic, 0.15),
});
OrbitControls.attach(hearth, camera, { target: Vec3.new(0, 1, 0) });
useWindowResizer(hearth, camera);
