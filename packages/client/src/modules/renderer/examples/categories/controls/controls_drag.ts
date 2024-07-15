import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import { PerspectiveCamera } from '@modules/renderer/engine/cameras/PerspectiveCamera.js';
import { Scene } from '@modules/renderer/engine/scenes/Scene.js';
import {
  BoxGeometry,
  BufferGeometry,
  Fog,
  Mesh,
  MeshLambertMaterial,
  Object3D,
  Raycaster,
  SpotLight,
  Vector2,
} from '@modules/renderer/engine/engine.js';
import { Vec3 } from '@modules/renderer/engine/math/Vector3.js';
import { DragControls } from '@modules/renderer/engine/controls/DragControls.js';
import { UI } from '@mimi/ui';
import { ColorMap } from '@modules/renderer/engine/math/Color.js';
import { Random } from '@modules/renderer/engine/math/random.js';
import { normalWorld } from '@modules/renderer/engine/nodes/accessors/NormalNode.js';
import { color } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.primitves.js';
import { Intersection } from 'three';

const createCamera = () => {
  const camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.25, 30);
  Vec3.set(camera.position, 0, 1, 3);
  camera.lookAt(0, 0, 0);

  return camera;
};
const createLight = () => new SpotLight(ColorMap.white, 30);
const createScene = () => {
  const scene = new Scene();
  scene.backgroundNode = normalWorld.y.mix(color(ColorMap.white), color(ColorMap.wheat));
  scene.fog = new Fog(ColorMap.red, 7, 25);
  return scene;
};
const createBox = (geometry: BufferGeometry, x: number, y: number, z: number) => {
  const material = new MeshLambertMaterial({ color: Random.color() });

  const mesh = new Mesh(geometry, material);
  Vec3.set(mesh.position, x, y, z);

  return mesh;
};

const useDragControls = () => {
  const objects: Object3D[] = [box];
  const controls = new DragControls([...objects], camera, renderer.parameters.canvas);

  const mouse = new Vector2();
  const raycaster = new Raycaster();

  renderer.parameters.canvas.addEventListener('click', event => {
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

const reference = createBox(new BoxGeometry(0.1, 0.1, 0.1), 0, 0, 0);
const box = createBox(new BoxGeometry(), 0, 0, 0);

const scene = createScene();
scene.add(camera, reference, box);

const renderer = await Renderer.create({
  animate() {
    renderer.render(scene, camera);
  },
});
const dragControls = useDragControls();

useWindowResizer(renderer, camera);

interface State {
  drag: {
    selected: Object3D | null;
    mode: 'translate' | 'rotate';
    intersections: Intersection<any>[];
    selection: boolean;
  };
}

const state = <State>{
  drag: {
    selected: null,
    mode: 'translate',
    intersections: [],
    selection: true,
  },
};
UI.create<State>('Drag controls', state)
  .text('Selected:', s => (s.drag.selected ? s.drag.selected.uuid : 'None'))
  .action('Log selected', s => console.info({ selected: s.drag.selected, intersections: s.drag.intersections }))
  .boolean('drag.selection', 'Selection', value => (dragControls.enabled = value))
  .option<'translate' | 'rotate'>(
    'drag.mode',
    'Mode',
    {
      translate: 'Translate',
      rotate: 'Rotate',
    },
    value => (dragControls.mode = value),
  )
  .shortcut('s', 'Toggle selection', state => {
    state.drag.selection = !state.drag.selection;
    dragControls.enabled = state.drag.selection;
  })
  .shortcut('m', 'Toggle drag mode', state => {
    state.drag.mode = state.drag.mode === 'translate' ? 'rotate' : 'translate';
    dragControls.mode = state.drag.mode;
  });
