import {
  AmbientLight,
  DirectionalLight,
  Hearth,
  Mesh,
  OrbitControls,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SphereGeometry,
} from '@modules/renderer/engine/engine.js';
import { color, MeshPhongNodeMaterial, occlude } from '@modules/renderer/engine/nodes/nodes.js';
import { WindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

const createCamera = () => {
  const camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 100);
  camera.position.z = 7;
  return camera;
};
const createAmbientLight = () => {
  return new AmbientLight(0xb0b0b0);
};
const createDirectionalLight = () => {
  const light = new DirectionalLight(0xffffff, 7);
  light.position.set(0.5, 1, 1).normalize();
  return light;
};
const attachOcclusion = (item: Mesh, to: Mesh) => {
  item.material.colorNode = occlude(to, color(0x00ff00), color(0x0000ff));
  to.position.z = -1;
  to.useOcclusion = true;
};
const createPlane = () => {
  const geometry = new PlaneGeometry(2, 2);
  const material = new MeshPhongNodeMaterial({ color: 0x00ff00 });
  return new Mesh(geometry, material);
};
const createSphere = () => {
  const geometry = new SphereGeometry(0.5);
  const material = new MeshPhongNodeMaterial({ color: 0xffff00 });
  return new Mesh(geometry, material);
};

const camera = createCamera();

const plane = createPlane();
const sphere = createSphere();

attachOcclusion(plane, sphere);

const scene = Scene.of(createAmbientLight(), createDirectionalLight(), plane, sphere);
const hearth = await Hearth.as({
  animate() {
    hearth.render(scene, camera);
  },
});
await hearth.compile(scene, camera);
OrbitControls.attach(hearth, camera);
WindowResizer.attach(hearth, camera);
