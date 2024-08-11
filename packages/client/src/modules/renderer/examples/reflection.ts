import {
  color,
  MeshPhongNodeMaterial,
  normalWorld,
  pass,
  reflector,
  texture,
  uv,
  vignette,
} from '@modules/renderer/engine/nodes/nodes.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import {
  AnimationMixer,
  BoxGeometry,
  ColorSpace,
  DirectionalLight,
  Fog,
  GLTFLoader,
  Hearth,
  HemisphereLight,
  Mesh,
  OrbitControls,
  PerspectiveCamera,
  Scene,
  TextureLoader,
  Vec3,
  Wrapping,
} from '@modules/renderer/engine/engine.js';

const createCamera = () => {
  const camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.25, 30);
  camera.position.set(2, 2.5, 3);
  camera.lookAt(0, 1, 0);
  return camera;
};
const createScene = () => {
  const scene = new Scene();
  scene.fog = new Fog(0x0487e2, 7, 25);
  scene.backgroundNode = normalWorld.y.mix(color(0x0487e2), color(0x0066ff));
  return scene;
};
const createLights = () => {
  const sunLight = new DirectionalLight(0xffe499, 5);
  sunLight.castShadow = true;
  sunLight.shadow.camera.near = 0.1;
  sunLight.shadow.camera.far = 5;
  sunLight.shadow.camera.right = 2;
  sunLight.shadow.camera.left = -2;
  sunLight.shadow.camera.top = 2;
  sunLight.shadow.camera.bottom = -2;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.bias = -0.001;
  sunLight.position.set(0.5, 3, 0.5);

  const waterAmbientLight = new HemisphereLight(0x333366, 0x74ccf4, 5);
  const skyAmbientLight = new HemisphereLight(0x74ccf4, 0, 1);

  return { sunLight, waterAmbientLight, skyAmbientLight };
};
const loadMichelle = async () => {
  const gltf = await GLTFLoader.loadAsync('resources/models/gltf/Michelle.glb');
  const model = gltf.scene;
  model.children[0].children[0].castShadow = true;

  const mixer = new AnimationMixer(model);
  const action = mixer.clipAction(gltf.animations[0]);
  action.play();

  return { model, mixer };
};
const loadFloor = async () => {
  const textureLoader = new TextureLoader();

  const floorColor = await textureLoader.loadAsync('resources/textures/floors/FloorsCheckerboard_S_Diffuse.jpg');
  floorColor.wrapS = Wrapping.Repeat;
  floorColor.wrapT = Wrapping.Repeat;
  floorColor.colorSpace = ColorSpace.SRGB;

  const floorNormal = await textureLoader.loadAsync('resources/textures/floors/FloorsCheckerboard_S_Normal.jpg');
  floorNormal.wrapS = Wrapping.Repeat;
  floorNormal.wrapT = Wrapping.Repeat;

  const floorUV = uv().mul(15);
  const floorNormalOffset = texture(floorNormal, floorUV).xy.mul(2).sub(1).mul(0.02);

  const reflection = reflector({ resolution: 0.5 });
  reflection.target.rotateX(-Math.PI / 2);
  reflection.uvNode = reflection.uvNode!.add(floorNormalOffset);

  const floorMaterial = new MeshPhongNodeMaterial();
  floorMaterial.colorNode = texture(floorColor, floorUV).add(reflection);

  const floor = new Mesh(new BoxGeometry(50, 0.001, 50), floorMaterial);
  floor.position.set(0, 0, 0);

  return { floor, reflection };
};
const createPostprocess = (hearth: Hearth, scene: Scene, camera: PerspectiveCamera) => {
  const scenePass = pass(scene, camera);
  const scenePassColor = scenePass.getTextureNode();
  const scenePassDepth = scenePass.getDepthNode().remapClamp(0.3, 0.5);

  const scenePassColorBlurred = scenePassColor.gaussianBlur();
  scenePassColorBlurred.directionNode = scenePassDepth;

  return hearth.postprocess(scenePassColorBlurred.mul(vignette()));
};

const camera = createCamera();
const { sunLight, waterAmbientLight, skyAmbientLight } = createLights();


const { model, mixer } = await loadMichelle();
const { floor, reflection } = await loadFloor();
const scene = createScene().add(sunLight, waterAmbientLight, skyAmbientLight, model, floor, reflection.target);

const hearth = await Hearth.as();

OrbitControls.attach(hearth, camera, {
  minDistance: 1,
  maxDistance: 10,
  maxPolarAngle: Math.PI / 2,
  autoRotate: true,
  autoRotateSpeed: 1,
  target: Vec3.new(0, 0.5, 0),
});
mixer.attach(hearth);

const postprocess = createPostprocess(hearth, scene, camera);

useWindowResizer(hearth, camera);
hearth.animation.loop = () => postprocess.render();
