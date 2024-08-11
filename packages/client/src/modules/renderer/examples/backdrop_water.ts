import {
  color,
  depth,
  depthTexture,
  MeshBasicNodeMaterial,
  MeshStandardNodeMaterial,
  Noise,
  normalWorld,
  objectPosition,
  pass,
  positionWorld,
  texture,
  timerLocal,
  triplanarTexture,
  vec2,
  viewportDepthTexture,
  viewportSharedTexture,
  viewportTopLeft,
  vignette,
} from '@modules/renderer/engine/nodes/nodes.js';
import {
  AnimationMixer,
  BoxGeometry,
  Clock,
  CylinderGeometry,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  IcosahedronGeometry,
  Mesh,
  PerspectiveCamera,
  Scene,
  Vec3,
  Wrapping,
} from '@modules/renderer/engine/engine.js';
import { GLTFLoader } from '@modules/renderer/engine/loaders/objects/GLTFLoader/GLTFLoader.js';
import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { OrbitControls } from '@modules/renderer/engine/entities/controls/OrbitControls.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { TextureLoader } from '@modules/renderer/engine/loaders/textures/TextureLoader/TextureLoader.js';

const createCamera = () => {
  const camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.25, 30);
  camera.position.set(3, 4, 5);
  return camera;
};
const createScene = () => {
  const scene = new Scene();
  scene.fog = new Fog(0x0487e2, 7, 25);
  scene.backgroundNode = normalWorld.y.mix(color(0x0487e2), color(0x0066ff));
  return scene;
};
const createSunLight = () => {
  const light = new DirectionalLight(0xffe499, 5);
  light.castShadow = true;
  light.shadow.camera.near = 0.1;
  light.shadow.camera.far = 5;
  light.shadow.camera.right = 2;
  light.shadow.camera.left = -2;
  light.shadow.camera.top = 1;
  light.shadow.camera.bottom = -2;
  light.shadow.mapSize.width = 2048;
  light.shadow.mapSize.height = 2048;
  light.shadow.bias = -0.001;
  light.position.set(0.5, 3, 0.5);

  return light;
};
const createAmbientWaterLight = () => new HemisphereLight(0x333366, 0x74ccf4, 5);
const createAmbientSkyLight = () => new HemisphereLight(0x74ccf4, 0, 1);
const createLights = () => {
  const sun = createSunLight();
  const water = createAmbientWaterLight();
  const sky = createAmbientSkyLight();

  return [sun, water, sky] as const;
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
const loadIceTexture = async () => {
  const iceDiffuse = await TextureLoader.loadAsync('resources/textures/water/water.jpg');
  iceDiffuse.wrapS = Wrapping.Repeat;
  iceDiffuse.wrapT = Wrapping.Repeat;
  iceDiffuse.colorSpace = null;

  return triplanarTexture(texture(iceDiffuse)).add(color(0x0066ff)).mul(0.8);

};
const createBuoys = (ice: Node) => {
  const geometry = new IcosahedronGeometry(1, 0);
  const material = new MeshStandardNodeMaterial({ colorNode: ice });

  const count = 100;
  const scale = 3.5;
  const column = 10;

  const buoys = new Group();

  for (let i = 0; i < count; i++) {
    const x = i % column;
    const y = i / column;

    const buoy = new Mesh(geometry, material);
    buoy.position.set(x * scale, 0, y * scale);
    buoy.setRotation(Math.random(), Math.random(), Math.random());

    buoys.add(buoy);
  }

  buoys.position.set((column - 1) * scale * -0.5, -1, (count / column) * scale * -0.5);

  return buoys;
};
const createWater = (ice: Node) => {
  const timer = timerLocal(1);
  const floorUV = positionWorld.xzy;

  const waterLayer0 = Noise.fractal.f32(floorUV.mul(4).add(timer));
  const waterLayer1 = Noise.perlin.f32(floorUV.mul(2).add(timer));

  const waterIntensity = waterLayer0.mul(waterLayer1);
  const waterColor = waterIntensity.mul(1.4).mix(color(0x0487e2), color(0x74ccf4));

  const depthWater = depthTexture(viewportDepthTexture()).sub(depth);
  const depthEffect = depthWater.remapClamp(-0.002, 0.04);

  const refractionUV = viewportTopLeft.add(vec2(0, waterIntensity.mul(0.1)));

  const depthTestForRefraction = depthTexture(viewportDepthTexture(refractionUV)).sub(depth);

  const depthRefraction = depthTestForRefraction.remapClamp(0, 0.1);

  const finalUV = depthTestForRefraction.lessThan(0).cond(viewportTopLeft, refractionUV);

  const viewportTexture = viewportSharedTexture(finalUV);

  const waterMaterial = new MeshBasicNodeMaterial();
  waterMaterial.colorNode = waterColor;
  waterMaterial.backdropNode = depthEffect.mix(
    viewportSharedTexture(),
    viewportTexture.mul(depthRefraction.mix(1, waterColor)),
  );
  waterMaterial.backdropAlphaNode = depthRefraction.oneMinus();
  waterMaterial.transparent = true;

  const water = new Mesh(new BoxGeometry(50, 0.001, 50), waterMaterial);
  water.position.set(0, 0, 0);

  const floor = new Mesh(new CylinderGeometry(1, 4, 10), new MeshStandardNodeMaterial({ colorNode: ice }));
  floor.position.set(0, -4, 0);

  const waterPosY = positionWorld.y.sub(water.position.y);

  let transition = waterPosY.add(0.1).saturate().oneMinus();
  transition = waterPosY.lessThan(0).cond(transition, normalWorld.y.mix(transition, 0)).toVar();

  floor.material.colorNode = transition.mix(ice, ice.add(waterLayer0));

  return { water, floor };
};
const createPostprocess = (hearth: Hearth, scene: Scene, camera: PerspectiveCamera) => {
  const render = pass(scene, camera);
  const color = render.getTextureNode();

  const waterTest = objectPosition(camera).y.greaterThan(0.2);

  const total = waterTest.cond(color.add(color.gaussianBlur().mul(0.1)), color.gaussianBlur().mul(vignette()));

  return hearth.postprocess(total);
};

const camera = createCamera();
const scene = createScene();
const [sunLight, waterAmbientLight, skyAmbientLight] = createLights();

const { model, mixer } = await loadMichelle();
model.position.set(0, 1, 0);

const ice = await loadIceTexture();
const buoys = await createBuoys(ice);
const { water, floor } = createWater(ice);
scene.add(sunLight, waterAmbientLight, skyAmbientLight, model, buoys, water, floor);

const clock = Clock.new();
const hearth = await Hearth.as({
  animate() {
    controls.update();

    const delta = clock.tick();


    mixer.update(delta);

    for (const object of buoys.children) {
      object.position.y = Math.sin(clock.total + object.id) * 0.3;
      object.rotateY(delta * 0.3);
    }

    postprocess.render();
  },
});
const postprocess = createPostprocess(hearth, scene, camera);
const controls = OrbitControls.attach(hearth, camera, {
  minDistance: 1,
  maxDistance: 10,
  maxPolarAngle: Math.PI * 0.9,
  autoRotate: true,
  autoRotateSpeed: 1,
  target: Vec3.new(0, 0.2, 0),
});
useWindowResizer(hearth, camera);

