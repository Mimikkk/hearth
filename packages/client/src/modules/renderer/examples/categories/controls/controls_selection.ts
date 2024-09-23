import { Hearth } from '@mimi/hearth';
import { PerspectiveCamera } from '@mimi/hearth';
import { Scene } from '@mimi/hearth';
import { ColorMap } from '@mimi/hearth';
import { AmbientLight } from '@mimi/hearth';
import { SpotLight } from '@mimi/hearth';
import { BoxGeometry } from '@mimi/hearth';
import { Mesh } from '@mimi/hearth';
import { MeshLambertMaterial } from '@mimi/hearth';
import { SelectionControls } from '@mimi/hearth';
import { SelectionVisualizer } from '@mimi/hearth';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { Vec3 } from '@mimi/hearth';
import { Fog } from '@mimi/hearth';
import { normalWorld } from '@mimi/hearth';
import { color } from '@mimi/hearth';
import { Group } from '@mimi/hearth';
import { MiniUi } from '@mimi/mini-ui';
import { Random } from '@mimi/hearth';
import { Stats } from '@modules/renderer/examples/ui/stats.js';

const createCamera = () => {
  const camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.z = 50;
  camera.lookAt(0, 1, 0);
  return camera;
};
const createScene = () => {
  const scene = new Scene();
  scene.fog = new Fog(ColorMap.blue, 1, 500);
  scene.backgroundNode = normalWorld.y.mix(color(ColorMap.white), color(ColorMap.wheat));
  scene.add(new AmbientLight(0xaaaaaa));
  return scene;
};
const createLight = () => {
  const light = new SpotLight(ColorMap.white, 10000);
  light.position.set(0, 25, 50);
  light.angle = Math.PI / 5;
  light.useShadowCast = true;
  light.shadow.camera.near = 10;
  light.shadow.camera.far = 100;
  light.shadow.mapSize.x = 1024;
  light.shadow.mapSize.y = 1024;

  return light;
};
const createBoxes = () => {
  const geometry = new BoxGeometry();

  const group = new Group();
  const randomScale = () => Random.number(1, 3);

  for (let i = 0; i < 200; ++i) {
    const box = new Mesh(geometry, new MeshLambertMaterial({ color: Random.color() }));

    box.position.set(Math.random() * 80 - 40, Math.random() * 45 - 25, Math.random() * 45 - 25);
    box.setRotation(Random.radian(), Random.radian(), Random.radian());
    box.scale.set(randomScale(), randomScale(), randomScale());

    group.add(box);
  }

  return group;
};

const camera = createCamera();
const scene = createScene();
const light = createLight();
const boxes = createBoxes();
scene.add(light, camera, boxes);

const hearth = await Hearth.as({
  animate() {
    ui.update();
    stats.update();
    hearth.render(scene, camera);
  },
});
const stats = Stats.attach(hearth);
useWindowResizer(hearth, camera);

const selection = new SelectionControls(camera, scene);
const visualizer = new SelectionVisualizer(hearth);
const updateVec = (vec3: Vec3, event: PointerEvent) => {
  vec3.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5);
};
hearth.parameters.canvas.addEventListener('pointerdown', event => {
  for (const object of selection.collection) {
    (object.material as MeshLambertMaterial).emissive.set(0x000000);
  }

  updateVec(selection.start, event);
});
hearth.parameters.canvas.addEventListener('pointermove', event => {
  if (!visualizer.isDown) return;
  for (const object of selection.collection) {
    (object.material as MeshLambertMaterial).emissive.set(0x000000);
  }

  updateVec(selection.end, event);

  for (const object of selection.select()) {
    (object.material as MeshLambertMaterial).emissive.set(0xff0000);
  }
});
hearth.parameters.canvas.addEventListener('pointerup', event => {
  updateVec(selection.end, event);

  for (const object of selection.select()) {
    (object.material as MeshLambertMaterial).emissive.set(0xff0000);
  }
});

const formatVec = ({ x, y }: { x: number; y: number }) => x.toFixed(2) + ', ' + y.toFixed(2);

const ui = MiniUi.create('Selection')
  .text('Selected count:', () => selection.collection.length)
  .text('Mouse start (x, y):', () => formatVec(selection.start))
  .text('Mouse end (x, y):', () => formatVec(selection.end))
  .action('Log selection', () => console.info(selection.collection))
  .action('Clear selection', () => {
    for (const object of selection.collection) {
      (object.material as MeshLambertMaterial).emissive.set(0x000000);
    }
    selection.start.set(0, 0, 0);
    selection.end.set(0, 0, 0);
    selection.collection.length = 0;
  });
