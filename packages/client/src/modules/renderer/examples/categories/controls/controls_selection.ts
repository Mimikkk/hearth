import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import { PerspectiveCamera } from '@modules/renderer/engine/cameras/PerspectiveCamera.js';
import { Scene } from '@modules/renderer/engine/scenes/Scene.js';
import { Color } from '@modules/renderer/engine/math/Color.js';
import { AmbientLight } from '@modules/renderer/engine/lights/AmbientLight.js';
import { SpotLight } from '@modules/renderer/engine/lights/SpotLight.js';
import { BoxGeometry } from '@modules/renderer/engine/geometries/BoxGeometry.js';
import { Mesh } from '@modules/renderer/engine/objects/Mesh.js';
import { MeshLambertMaterial } from '@modules/renderer/engine/materials/MeshLambertMaterial.js';
import { SelectionControl } from '@modules/renderer/engine/interactive/SelectionControl.js';
import { SelectionVisualizer } from '@modules/renderer/engine/interactive/SelectionVisualizer.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { useStats } from '@modules/renderer/examples/utilities/useStats.js';
import { Vec3 } from '@modules/renderer/engine/math/Vector3.js';
import { Fog } from '@modules/renderer/engine/scenes/Fog.js';
import { normalWorld } from '@modules/renderer/engine/nodes/accessors/NormalNode.js';
import { color } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.primitves.js';
import { Group } from '@modules/renderer/engine/objects/Group.js';
import { UI } from '@mimi/ui';
import { Vec2 } from '@modules/renderer/engine/math/Vector2.js';

const createCamera = () => {
  const camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.z = 50;
  return camera;
};
const createScene = () => {
  const scene = new Scene();
  scene.fog = new Fog('blue', 1, 500);
  scene.backgroundNode = normalWorld.y.mix(color('white'), color('wheat'));
  scene.add(new AmbientLight(0xaaaaaa));
  return scene;
};
const createLight = () => {
  const light = new SpotLight(0xffffff, 10000);
  light.position.set(0, 25, 50);
  light.angle = Math.PI / 5;
  light.castShadow = true;
  light.shadow.camera.near = 10;
  light.shadow.camera.far = 100;
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;

  return light;
};

const camera = createCamera();
const scene = createScene();
const light = createLight();
scene.add(light);

const createBoxes = () => {
  const geometry = new BoxGeometry();

  const group = new Group();
  const randomScale = () => Math.random() * 2 + 1;
  const randomAngle = () => Math.random() * 2 * Math.PI;
  const randomColor = () => new Color(Math.random() * 0xffffff);

  for (let i = 0; i < 200; ++i) {
    const box = new Mesh(geometry, new MeshLambertMaterial({ color: randomColor() }));

    box.setPosition(Math.random() * 80 - 40, Math.random() * 45 - 25, Math.random() * 45 - 25);
    box.setRotation(randomAngle(), randomAngle(), randomAngle());
    box.setScale(randomScale(), randomScale(), randomScale());

    group.add(box);
  }

  return group;
};

const boxes = createBoxes();
scene.add(boxes);

const stats = useStats();
const renderer = await Renderer.create({
  animate() {
    renderer.render(scene, camera);
    stats.update();
    ui.update();
  },
});
useWindowResizer(renderer, camera);

const selection = new SelectionControl(camera, scene);
const visualizer = new SelectionVisualizer(renderer);
const updateVec = (vec3: Vec3, event: PointerEvent) => {
  Vec3.set(vec3, (event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5);
};
renderer.parameters.canvas.addEventListener('pointerdown', event => {
  for (const object of selection.collection) {
    (object.material as MeshLambertMaterial).emissive.set(0x000000);
  }

  updateVec(selection.start, event);
});
renderer.parameters.canvas.addEventListener('pointermove', event => {
  if (!visualizer.isDown) return;
  for (const object of selection.collection) {
    (object.material as MeshLambertMaterial).emissive.set(0x000000);
  }

  updateVec(selection.end, event);

  for (const object of selection.select()) {
    (object.material as MeshLambertMaterial).emissive.set(0xff0000);
  }
});
renderer.parameters.canvas.addEventListener('pointerup', event => {
  updateVec(selection.end, event);

  for (const object of selection.select()) {
    (object.material as MeshLambertMaterial).emissive.set(0xff0000);
  }
});

const formatVec = ({ x, y }: Vec2) => x.toFixed(2) + ', ' + y.toFixed(2);

const ui = UI.create('Selection')
  .text('Selected count:', () => selection.collection.length)
  .text('Mouse start (x, y):', () => formatVec(selection.start))
  .text('Mouse end (x, y):', () => formatVec(selection.end))
  .action('Log selection', () => console.log(selection.collection))
  .action('Clear selection', () => {
    for (const object of selection.collection) {
      (object.material as MeshLambertMaterial).emissive.set(0x000000);
    }
    Vec3.clear(selection.start);
    Vec3.clear(selection.end);
    selection.collection.length = 0;
  });
