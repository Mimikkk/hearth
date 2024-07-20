import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import { PerspectiveCamera } from '@modules/renderer/engine/cameras/PerspectiveCamera.js';
import { Scene } from '@modules/renderer/engine/scenes/Scene.js';
import { normalWorld } from '@modules/renderer/engine/nodes/accessors/NormalNode.js';
import { color } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.primitves.js';
import {
  BoundingBoxVisualizer,
  BoxGeometry,
  BufferGeometry,
  Fog,
  Group,
  Mesh,
  MeshLambertMaterial,
  Object3D,
  Raycaster,
  SphereGeometry,
  SpotLight,
  Vector2,
} from '@modules/renderer/engine/engine.js';
import { OrbitControls } from '@modules/renderer/engine/controls/OrbitControls.js';
import { Vec3 } from '@modules/renderer/engine/math/Vector3.js';
import { DragControls } from '@modules/renderer/engine/controls/DragControls.js';
import { UI } from '@modules/renderer/examples/utilities/UI.js';

const container = document.createElement('div');
document.body.appendChild(container);

const createCamera = () => {
  const camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.25, 30);
  Vec3.set(camera.position, 0, 2, 3);
  return camera;
};
const createLight = () => new SpotLight(0xffffff, 30);
const createScene = () => {
  const scene = new Scene();
  scene.fog = new Fog('red', 7, 25);
  return scene;
};
const createRenderer = async (onAnimate: () => void) => {
  const renderer = await Renderer.create();
  renderer.setAnimationLoop(onAnimate);
  document.body.appendChild(renderer.parameters.canvas);

  return renderer;
};

const createSphere = (geometry: BufferGeometry, x: number, y: number, z: number) => {
  const material = new MeshLambertMaterial({ color: Math.random() * 0xffffff });

  const mesh = new Mesh(geometry, material);
  mesh.position.set(x, y, z);

  return mesh;
};

const state = {
  drag: {
    selected: null as Object3D | null,
    mode: 'translate' as 'translate' | 'rotate',
    selection: true,
  },
};
const useOrbitControls = () => {
  const controls = new OrbitControls(camera, renderer.parameters.canvas);
  controls.minDistance = 1;
  controls.maxDistance = 10;
  controls.maxPolarAngle = Math.PI * 0.9;
  controls.target.set(0, 0.2, 0);
  controls.update();

  return controls;
};
const useDragControls = () => {
  const objects: Object3D[] = [sphere];
  const controls = new DragControls([...objects], camera, renderer.parameters.canvas);

  const mouse = new Vector2();
  const raycaster = new Raycaster();

  document.addEventListener('click', event => {
    if (!state.drag.selection) return;

    const draggableObjects = controls.getObjects();
    draggableObjects.length = 0;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersections = raycaster.intersects(objects, true);
    console.log({ objects, intersections });

    // if (intersections.length > 0) {
    //   const object = intersections[0].object;
    //
    //   if (group.children.includes(object)) {
    //     object.material.emissive.set(0x000000);
    //     scene.attach(object);
    //   } else {
    //     object.material.emissive.set(0xaaaaaa);
    //     group.attach(object);
    //   }
    //
    //   controls.transformGroup = true;
    //   draggableObjects.push(group);
    // }

    // if (group.children.length === 0) {
    //   controls.transformGroup = false;
    //   draggableObjects.push(...objects);
    // }
  });

  return controls;
};

const light = createLight();
const camera = createCamera();
camera.add(light);

const reference = createSphere(new SphereGeometry(0.1, 32, 24), 0, 0, 0);
const sphere = createSphere(new SphereGeometry(0.25, 32, 24), 1, 0, 0);
// const spheres = createSpheres();

const scene = createScene();
scene.add(camera, reference, sphere);

const renderer = await createRenderer(() => {
  orbitControls.update();
  renderer.render(scene, camera);
});

useWindowResizer(renderer, camera);

const dragControls = useDragControls();
const orbitControls = useOrbitControls();

const ui = UI.create('Controls', state)
  .shortcut('s', 'Toggle selection', state => {
    state.drag.selection = !state.drag.selection;
    dragControls.enabled = state.drag.selection;
  })
  .shortcut('m', 'Toggle drag mode', state => {
    state.drag.mode = state.drag.mode === 'translate' ? 'rotate' : 'translate';
    dragControls.mode = state.drag.mode;
  });

ui.folder('Drag info').text('Selected:', s => (s.drag.selected ? s.drag.selected.uuid : 'None'));

ui.folder('Drag options')
  .boolean('drag.selection', 'Selection', value => (dragControls.enabled = value))
  .option<'translate' | 'rotate'>(
    'drag.mode',
    'Mode',
    {
      translate: 'Translate',
      rotate: 'Rotate',
    },
    value => (dragControls.mode = value),
  );
