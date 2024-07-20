import * as Engine from '@modules/renderer/engine/engine.js';
import {
  color,
  LightingModel,
  lights,
  MeshStandardNodeMaterial,
  PointsNodeMaterial,
  toneMapping,
} from '@modules/renderer/engine/nodes/Nodes.js';

import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';

import { OrbitControls } from '@modules/renderer/engine/controls/OrbitControls.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

class CustomLightingModel extends LightingModel {
  direct({ lightColor, reflectedLight }, stack) {
    reflectedLight.directDiffuse.addAssign(lightColor);
  }
}

let camera, scene, renderer;

let light1, light2, light3;

init();

async function init() {
  camera = new Engine.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 10);
  camera.position.z = 2;

  scene = new Engine.Scene();
  scene.background = new Engine.Color(0x222222);

  // lights

  const sphereGeometry = new Engine.SphereGeometry(0.02, 16, 8);

  const addLight = (hexColor, intensity = 2, distance = 1) => {
    const material = new MeshStandardNodeMaterial();
    material.colorNode = color(hexColor);
    material.lightsNode = lights(); // ignore scene lights

    const mesh = new Engine.Mesh(sphereGeometry, material);

    const light = new Engine.PointLight(hexColor, intensity, distance);
    light.add(mesh);

    scene.add(light);

    return light;
  };

  light1 = addLight(0xffaa00);
  light2 = addLight(0x0040ff);
  light3 = addLight(0x80ff80);

  //light nodes ( selective lights )

  const allLightsNode = lights([light1, light2, light3]);

  // points

  const points = [];

  for (let i = 0; i < 3000; i++) {
    const point = new Engine.Vec3().random().subScalar(0.5).scale(2);
    points.push(point);
  }

  const geometryPoints = new Engine.BufferGeometry().setFromPoints(points);
  const materialPoints = new PointsNodeMaterial();

  // custom lighting model

  const lightingModel = new CustomLightingModel();
  const lightingModelContext = allLightsNode.context({ lightingModel });

  materialPoints.lightsNode = lightingModelContext;

  //

  const pointCloud = new Engine.Points(geometryPoints, materialPoints);
  scene.add(pointCloud);

  //

  renderer = await Renderer.create();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.parameters.toneMappingNode = toneMapping(Engine.ToneMapping.Linear, 1);
  document.body.appendChild(renderer.parameters.canvas);

  // controls

  const controls = new OrbitControls(camera, renderer.parameters.canvas);
  controls.minDistance = 0;
  controls.maxDistance = 4;

  useWindowResizer(renderer, camera);
}

function animate() {
  const time = Date.now() * 0.0005;
  const scale = 0.5;

  light1.position.x = Math.sin(time * 0.7) * scale;
  light1.position.y = Math.cos(time * 0.5) * scale;
  light1.position.z = Math.cos(time * 0.3) * scale;

  light2.position.x = Math.cos(time * 0.3) * scale;
  light2.position.y = Math.sin(time * 0.5) * scale;
  light2.position.z = Math.sin(time * 0.7) * scale;

  light3.position.x = Math.sin(time * 0.7) * scale;
  light3.position.y = Math.cos(time * 0.3) * scale;
  light3.position.z = Math.sin(time * 0.5) * scale;

  renderer.render(scene, camera);
}
