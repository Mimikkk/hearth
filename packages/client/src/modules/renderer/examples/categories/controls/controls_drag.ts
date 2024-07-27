import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { Renderer } from '@modules/renderer/engine/renderers/Renderer.js';
import { PerspectiveCamera } from '@modules/renderer/engine/objects/cameras/PerspectiveCamera.js';
import { Scene } from '@modules/renderer/engine/objects/scenes/Scene.js';
import {
  BoxGeometry,
  Geometry,
  Fog,
  Mesh,
  MeshLambertMaterial,
  Entity,
  SpotLight,
} from '@modules/renderer/engine/engine.js';
import { DragControls } from '@modules/renderer/engine/objects/controls/DragControls.js';
import { UI } from '@mimi/ui';
import { ColorMap } from '@modules/renderer/engine/math/Color.js';
import { Random } from '@modules/renderer/engine/math/random.js';
import { normalWorld } from '@modules/renderer/engine/nodes/accessors/NormalNode.js';
import { color } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.primitves.js';
import { BoundingSphereVisualizer } from '@modules/renderer/engine/objects/visualizers/BoundingSphereVisualizer.js';
import { Intersection } from '@modules/renderer/engine/core/Raycaster.js';

const createCamera = () => {
  const camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.25, 30);
  camera.position.set(0, 1, 3);
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
const createBox = (geometry: Geometry, x: number, y: number, z: number) => {
  const material = new MeshLambertMaterial({ color: Random.color() });

  const mesh = new Mesh(geometry, material);
  mesh.position.set(x, y, z);

  return mesh;
};

const useDragControls = () => {
  const objects: Entity[] = [box1, box2];
  const controls = new DragControls([...objects], camera, renderer.parameters.canvas);

  // const mouse = Vec2.new();
  // const raycaster = Raycaster.new();

  // renderer.parameters.canvas.addEventListener('click', event => {
  //   if (!state.drag.selection) return;
  //
  //   const draggableObjects = controls.getObjects();
  //   draggableObjects.length = 0;
  //
  //   mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  //   mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  //
  //   raycaster.fromCamera(mouse, camera);
  //
  //   const intersections = raycaster.intersects(objects, true);
  //
  //   // if (intersections.length > 0) {
  //   //   const object = intersections[0].object;
  //   //
  //   //   if (group.children.includes(object)) {
  //   //     object.material.emissive.set(0x000000);
  //   //     scene.attach(object);
  //   //   } else {
  //   //     object.material.emissive.set(0xaaaaaa);
  //   //     group.attach(object);
  //   //   }
  //   //
  //   //   controls.configuration.transformGroup = true;
  //   //   draggableObjects.push(group);
  //   // }
  //
  //   // if (group.children.length === 0) {
  //   //   controls.configuration.transformGroup = false;
  //   //   draggableObjects.push(...objects);
  //   // }
  // });

  return controls;
};

const light = createLight();
const camera = createCamera();
camera.add(light);

const reference = createBox(new BoxGeometry(0.1, 0.1, 0.1), 0, 1, 0);
const box1 = createBox(new BoxGeometry(0.5, 0.2, 0.7), 0.5, 0, 0);
const box2 = createBox(new BoxGeometry(0.2, 0.4, 0.7), -0.5, 0, 0);

const scene = createScene();

const sphere1 = BoundingSphereVisualizer.attach(box1);
const sphere2 = BoundingSphereVisualizer.attach(box2);

scene.add(camera, reference, box1, box2);

const renderer = await Renderer.as({
  animate() {
    renderer.render(scene, camera);
  },
});
const dragControls = useDragControls();

useWindowResizer(renderer, camera);

interface State {
  drag: {
    selected: Entity | null;
    mode: 'translate' | 'rotate';
    intersections: Intersection[];
    selection: boolean;
    showBoundingSpheres: boolean;
  };
}

const state = <State>{
  drag: {
    selected: null,
    mode: 'translate',
    intersections: [],
    selection: true,
    showBoundingSpheres: true,
  },
};
UI.create<State>('Drag controls', state)
  .shortcut('s', 'Toggle selection', state => {
    state.drag.selection = !state.drag.selection;
    dragControls.configuration.enabled = state.drag.selection;
  })
  .shortcut('m', 'Toggle drag mode', state => {
    state.drag.mode = state.drag.mode === 'translate' ? 'rotate' : 'translate';
    dragControls.configuration.mode = state.drag.mode;
  })
  .text('Selected:', s => (s.drag.selected ? s.drag.selected.uuid : 'None'))
  .action('Log selected', s => console.info({ selected: s.drag.selected, intersections: s.drag.intersections }))
  .folder('Options')
  .boolean('drag.selection', 'Selection', value => (dragControls.configuration.enabled = value))
  .option<'translate' | 'rotate'>(
    'drag.mode',
    'Mode',
    {
      translate: 'Translate',
      rotate: 'Rotate',
    },
    value => (dragControls.configuration.mode = value),
  )
  .boolean('drag.showBoundingSpheres', 'Show bounding spheres', () => {
    sphere1.visible = state.drag.showBoundingSpheres;
    sphere2.visible = state.drag.showBoundingSpheres;
  });
