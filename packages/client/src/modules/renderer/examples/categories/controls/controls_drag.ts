import { useWindowResizer, WindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { PerspectiveCamera } from '@modules/renderer/engine/entities/cameras/PerspectiveCamera.js';
import { Scene } from '@modules/renderer/engine/entities/scenes/Scene.js';
import {
  AxisMode,
  BoxGeometry,
  Fog,
  Geometry,
  Mesh,
  MeshLambertMaterial,
  OrbitControls,
  SpotLight,
  TransformMode,
} from '@modules/renderer/engine/engine.js';
import { DragControls } from '@modules/renderer/engine/entities/controls/DragControls.js';
import { MiniUi } from '@mimi/mini-ui';
import { ColorMap } from '@modules/renderer/engine/math/Color.js';
import { Random } from '@modules/renderer/engine/math/random.js';
import { normalWorld } from '@modules/renderer/engine/nodes/accessors/NormalNode.js';
import { color } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.primitves.js';
import { BoundSphereVisualizer } from '@modules/renderer/engine/entities/visualizers/BoundSphereVisualizer.js';

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

const camera = createCamera().add(createLight());

const reference = createBox(new BoxGeometry(0.1, 0.1, 0.1), 0, 1, 0);
const box1 = createBox(new BoxGeometry(0.5, 0.2, 0.7), 0.5, 0, 0);
const box2 = createBox(new BoxGeometry(0.2, 0.4, 0.7), -0.5, 0, 0);

const sphere1 = BoundSphereVisualizer.attach(box1);
const sphere2 = BoundSphereVisualizer.attach(box2);

const scene = createScene().add(camera, reference, box1, box2, sphere1, sphere2);

const hearth = await Hearth.as();
const orbit = OrbitControls.attach(hearth, camera);
const controls = DragControls.attach(hearth, camera, [box1, box2], {
  onDragStart() {
    orbit.enabled = false;
  },
  onDragEnd() {
    orbit.enabled = true;
  },
});
WindowResizer.attach(hearth, camera);
scene.attach(hearth, camera);

interface State {
  drag: {
    mode: TransformMode;
    showBoundingSpheres: boolean;
  };
  controls: DragControls;
}

const state = <State>{
  drag: {
    mode: 'translate',
    showBoundingSpheres: true,
  },
  controls,
};
MiniUi.create<State>('Drag controls', state)
  .shortcut('x', 'Toggle axis x', state => {
    state.controls.useAxisX = !state.controls.useAxisX;
  })
  .shortcut('y', 'Toggle axis y', state => {
    state.controls.useAxisY = !state.controls.useAxisY;
  })
  .shortcut('z', 'Toggle axis y', state => {
    state.controls.useAxisZ = !state.controls.useAxisZ;
  })
  .shortcut('w', 'Toggle axis mode', state => {
    const axis = state.controls.useAxisMode;
    state.controls.useAxisMode = axis === 'world' ? 'local' : axis === 'local' ? 'view' : 'world';
  })
  .shortcut('e', 'Toggle enable', state => {
    state.controls.enabled = !state.controls.enabled;
  })
  .shortcut('m', 'Toggle drag mode', state => {
    state.controls.mode = state.controls.mode === 'translate' ? 'rotate' : 'translate';
  })
  .folder('Options')
  .boolean('controls.enabled', 'Enabled')
  .option<TransformMode>('controls.mode', 'Mode', {
    translate: 'Translate',
    rotate: 'Rotate',
  })
  .option<AxisMode>('controls.useAxisMode', 'Axis mode', {
    world: 'World',
    local: 'Local',
    view: 'View',
  })
  .boolean('controls.useAxisX', 'Axis X', value => (controls.useAxisX = value))
  .boolean('controls.useAxisY', 'Axis Y', value => (controls.useAxisY = value))
  .boolean('controls.useAxisZ', 'Axis Z', value => (controls.useAxisZ = value))
  .boolean('drag.showBoundingSpheres', 'Show bounding spheres', () => {
    sphere1.visible = state.drag.showBoundingSpheres;
    sphere2.visible = state.drag.showBoundingSpheres;
  });
